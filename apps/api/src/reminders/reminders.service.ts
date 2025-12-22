import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  ReminderType,
  buildPortalReminders,
  buildTenancyRenewalReminders,
} from "@leadlah/core";
import { LessThanOrEqual, Repository } from "typeorm";
import {
  ReminderEntity,
  ReminderRecurrence,
  ReminderStatus,
} from "./entities/reminder.entity";
import { CreateReminderDto } from "./dto/create-reminder.dto";
import { ListRemindersQueryDto } from "./dto/list-reminders.query";

export type StoredReminder = {
  id: string;
  userId: string;
  listingId?: string;
  listingName?: string;
  type: string;
  status: ReminderStatus;
  dueAt: Date;
  message: string;
  recurrence: ReminderRecurrence;
  recurrenceInterval: number;
  metadata?: Record<string, unknown>;
  completedAt?: Date;
  dismissedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type DashboardReminders = {
  today: StoredReminder[];
  tomorrow: StoredReminder[];
  thisWeek: StoredReminder[];
};

const zonedDateKey = (date: Date, timeZone: string) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
};

const daysUntilSunday = (date: Date, timeZone: string) => {
  const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  });
  const weekday = weekdayFormatter.format(date);
  const order: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const dayIndex = order[weekday] ?? date.getDay();
  return (7 - dayIndex) % 7;
};

const nextDueAt = (
  dueAt: Date,
  recurrence: ReminderRecurrence,
  interval: number,
) => {
  if (recurrence === "WEEKLY") {
    const advanced = new Date(dueAt);
    advanced.setDate(advanced.getDate() + 7 * interval);
    return advanced;
  }

  if (recurrence === "MONTHLY") {
    const advanced = new Date(dueAt);
    advanced.setMonth(advanced.getMonth() + interval);
    return advanced;
  }

  return dueAt;
};

const toStoredReminder = (entity: ReminderEntity): StoredReminder => ({
  id: entity.id,
  userId: entity.userId,
  listingId: entity.listingId ?? undefined,
  listingName: entity.listing?.propertyName ?? undefined,
  type: entity.type,
  status: entity.status,
  dueAt: entity.dueAt,
  message: entity.message,
  recurrence: entity.recurrence,
  recurrenceInterval: entity.recurrenceInterval,
  metadata: entity.metadata ?? undefined,
  completedAt: entity.completedAt ?? undefined,
  dismissedAt: entity.dismissedAt ?? undefined,
  createdAt: entity.createdAt,
  updatedAt: entity.updatedAt,
});

@Injectable()
export class RemindersService {
  constructor(
    @InjectRepository(ReminderEntity)
    private readonly reminders: Repository<ReminderEntity>,
  ) {}

  async list(
    userId: string,
    query: ListRemindersQueryDto = {},
  ): Promise<StoredReminder[]> {
    const limit = query.limit ?? 250;
    const where: any = { userId };
    if (query.type) {
      where.type = query.type;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.dueBefore) {
      const dueBefore = new Date(query.dueBefore);
      if (Number.isNaN(dueBefore.getTime())) {
        throw new BadRequestException(
          "dueBefore must be a valid ISO date string",
        );
      }
      where.dueAt = LessThanOrEqual(dueBefore);
    }

    const items = await this.reminders.find({
      where,
      relations: { listing: true },
      order: { dueAt: "ASC" },
      take: limit,
    });
    return items.map(toStoredReminder);
  }

  async dashboard(
    userId: string,
    timeZone: string,
  ): Promise<DashboardReminders> {
    const resolvedTz = timeZone || "UTC";
    const now = new Date();
    const days = daysUntilSunday(now, resolvedTz);
    const end = new Date(now);
    end.setDate(end.getDate() + Math.max(days, 2));
    end.setHours(23, 59, 59, 999);

    const items = await this.reminders.find({
      where: {
        userId,
        status: "PENDING",
        dueAt: LessThanOrEqual(end),
      },
      relations: { listing: true },
      order: { dueAt: "ASC" },
      take: 250,
    });

    const todayKey = zonedDateKey(now, resolvedTz);
    const tomorrowKey = zonedDateKey(
      new Date(now.getTime() + 24 * 60 * 60 * 1000),
      resolvedTz,
    );

    const thisWeekKeys = new Set<string>();
    for (let offset = 2; offset <= days; offset += 1) {
      thisWeekKeys.add(
        zonedDateKey(
          new Date(now.getTime() + offset * 24 * 60 * 60 * 1000),
          resolvedTz,
        ),
      );
    }

    const groups: DashboardReminders = {
      today: [],
      tomorrow: [],
      thisWeek: [],
    };
    for (const entity of items) {
      const reminder = toStoredReminder(entity);
      const dueKey = zonedDateKey(reminder.dueAt, resolvedTz);
      if (dueKey === todayKey || reminder.dueAt.getTime() < now.getTime()) {
        groups.today.push(reminder);
      } else if (dueKey === tomorrowKey) {
        groups.tomorrow.push(reminder);
      } else if (thisWeekKeys.has(dueKey)) {
        groups.thisWeek.push(reminder);
      }
    }

    return groups;
  }

  async create(
    userId: string,
    payload: CreateReminderDto,
  ): Promise<StoredReminder> {
    const dueAt = new Date(payload.dueAt);
    if (Number.isNaN(dueAt.getTime())) {
      throw new BadRequestException("dueAt must be a valid ISO date string");
    }

    const entity = this.reminders.create({
      userId,
      listingId: payload.listingId ?? null,
      type: payload.type,
      dueAt,
      message: payload.message,
      status: "PENDING",
      recurrence: payload.recurrence ?? "NONE",
      recurrenceInterval: payload.recurrenceInterval ?? 1,
      metadata: payload.metadata ?? null,
    });

    const saved = await this.reminders.save(entity);
    return toStoredReminder(saved);
  }

  async complete(userId: string, reminderId: string): Promise<StoredReminder> {
    const entity = await this.reminders.findOne({
      where: { id: reminderId, userId },
    });
    if (!entity) {
      throw new NotFoundException("Reminder not found");
    }

    const now = new Date();
    if (entity.recurrence && entity.recurrence !== "NONE") {
      entity.dueAt = nextDueAt(
        entity.dueAt,
        entity.recurrence,
        Math.max(entity.recurrenceInterval ?? 1, 1),
      );
      entity.completedAt = now;
      entity.dismissedAt = null;
      entity.status = "PENDING";
    } else {
      entity.status = "DONE";
      entity.completedAt = now;
    }

    const saved = await this.reminders.save(entity);
    return toStoredReminder(saved);
  }

  async dismiss(userId: string, reminderId: string): Promise<StoredReminder> {
    const entity = await this.reminders.findOne({
      where: { id: reminderId, userId },
    });
    if (!entity) {
      throw new NotFoundException("Reminder not found");
    }

    entity.status = "DISMISSED";
    entity.dismissedAt = new Date();
    const saved = await this.reminders.save(entity);
    return toStoredReminder(saved);
  }

  async schedulePortal(userId: string, listingId: string, days: number) {
    const items = buildPortalReminders(listingId, days);
    const entities = items.map((reminder) =>
      this.reminders.create({
        userId,
        listingId: reminder.listingId ?? null,
        type: reminder.type,
        dueAt: reminder.dueAt,
        message: reminder.message,
        status: "PENDING",
        recurrence: "NONE",
        recurrenceInterval: 1,
        metadata: null,
      }),
    );

    const saved = await this.reminders.save(entities);
    return saved.map(toStoredReminder);
  }

  async scheduleTenancy(userId: string, listingId: string, tenancyEnd: Date) {
    const items = buildTenancyRenewalReminders(listingId, tenancyEnd);
    const entities = items.map((reminder) =>
      this.reminders.create({
        userId,
        listingId: reminder.listingId ?? null,
        type: reminder.type,
        dueAt: reminder.dueAt,
        message: reminder.message,
        status: "PENDING",
        recurrence: "NONE",
        recurrenceInterval: 1,
        metadata: null,
      }),
    );

    const saved = await this.reminders.save(entities);
    return saved.map(toStoredReminder);
  }

  async listLegacy(type?: ReminderType) {
    return this.reminders.find({
      where: type ? { type } : {},
      order: { dueAt: "ASC" },
      take: 500,
    });
  }
}
