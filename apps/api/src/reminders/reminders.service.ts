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
import { Between, LessThanOrEqual, Repository } from "typeorm";
import {
  ReminderEntity,
  ReminderRecurrence,
  ReminderStatus,
} from "./entities/reminder.entity";
import { CreateReminderDto } from "./dto/create-reminder.dto";
import { ListRemindersQueryDto } from "./dto/list-reminders.query";
import { SyncPlatformExpiryDto } from "./dto/sync-platform-expiry.dto";
import { ProcessViewingEntity } from "../process/entities/process-viewing.entity";

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
    @InjectRepository(ProcessViewingEntity)
    private readonly viewings: Repository<ProcessViewingEntity>,
  ) {}

  private toViewingReminder(userId: string, viewing: ProcessViewingEntity): StoredReminder | null {
    if (!viewing.viewedAt) {
      return null;
    }

    return {
      id: `viewing:${viewing.id}`,
      userId,
      listingId: viewing.listingId,
      listingName: viewing.listing?.propertyName ?? undefined,
      type: "VIEWING_APPOINTMENT",
      status: "PENDING",
      dueAt: viewing.viewedAt,
      message: `Viewing scheduled with ${viewing.name}`,
      recurrence: "NONE",
      recurrenceInterval: 1,
      metadata: {
        kind: "VIEWING",
        viewingId: viewing.id,
        customerName: viewing.name,
        phone: viewing.phone ?? undefined,
        email: viewing.email ?? undefined,
      } satisfies Record<string, unknown>,
      completedAt: undefined,
      dismissedAt: undefined,
      createdAt: viewing.createdAt,
      updatedAt: viewing.updatedAt,
    };
  }

  private buildPlatformExpiryReminder(
    link: { provider: string; url: string; expiresAt?: string | Date | null },
    leadDays: number,
  ) {
    if (!link.expiresAt) {
      return null;
    }
    const expiresAt =
      link.expiresAt instanceof Date ? link.expiresAt : new Date(link.expiresAt);
    if (Number.isNaN(expiresAt.getTime())) {
      return null;
    }

    const actionAt = new Date(expiresAt);
    actionAt.setDate(actionAt.getDate() - leadDays);
    actionAt.setHours(9, 0, 0, 0);

    const dayLabel =
      leadDays === 0
        ? "today"
        : leadDays === 1
          ? "in 1 day"
          : `in ${leadDays} days`;

    return {
      dueAt: actionAt,
      message: `${link.provider} listing expiring ${dayLabel} — kindly renew.`,
      metadata: {
        kind: "PLATFORM_EXPIRY",
        provider: link.provider,
        url: link.url,
        expiresAt: expiresAt.toISOString(),
        leadDays,
      } satisfies Record<string, unknown>,
    };
  }

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
    const rangeDays = Math.max(days, 2);
    const end = new Date(now);
    end.setDate(end.getDate() + rangeDays);
    end.setHours(23, 59, 59, 999);

    const [items, upcomingViewings] = await Promise.all([
      this.reminders.find({
        where: {
          userId,
          status: "PENDING",
          dueAt: LessThanOrEqual(end),
        },
        relations: { listing: true },
        order: { dueAt: "ASC" },
        take: 250,
      }),
      this.viewings.find({
        where: {
          viewedAt: Between(now, end),
        },
        relations: { listing: true },
        order: { viewedAt: "ASC" },
        take: 250,
      }),
    ]);

    const todayKey = zonedDateKey(now, resolvedTz);
    const tomorrowKey = zonedDateKey(
      new Date(now.getTime() + 24 * 60 * 60 * 1000),
      resolvedTz,
    );

    const thisWeekKeys = new Set<string>();
    for (let offset = 2; offset <= rangeDays; offset += 1) {
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

    for (const viewing of upcomingViewings) {
      const reminder = this.toViewingReminder(userId, viewing);
      if (!reminder) {
        continue;
      }
      const dueKey = zonedDateKey(reminder.dueAt, resolvedTz);
      if (dueKey === todayKey) {
        groups.today.push(reminder);
      } else if (dueKey === tomorrowKey) {
        groups.tomorrow.push(reminder);
      } else if (thisWeekKeys.has(dueKey)) {
        groups.thisWeek.push(reminder);
      }
    }

    for (const key of ["today", "tomorrow", "thisWeek"] as const) {
      groups[key].sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
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

  async syncPlatformExpiry(
    userId: string,
    listingId: string,
    payload: SyncPlatformExpiryDto,
  ): Promise<StoredReminder[]> {
    const leadDays =
      typeof payload.leadDays === "number" && payload.leadDays >= 0
        ? payload.leadDays
        : 1;

    const expiryLinks = (payload.externalLinks ?? []).filter(
      (link) => link?.url && link.expiresAt,
    );
    const urls = new Set(expiryLinks.map((link) => link.url));

    const existing = await this.reminders.find({
      where: { userId, listingId, type: "PLATFORM_LISTING_EXPIRY" },
      relations: { listing: true },
      order: { createdAt: "ASC" },
      take: 250,
    });

    const byUrl = new Map<string, ReminderEntity>();
    for (const reminder of existing) {
      const url =
        reminder.metadata && typeof reminder.metadata === "object"
          ? String((reminder.metadata as any).url ?? "")
          : "";
      if (url) {
        byUrl.set(url, reminder);
      }
    }

    const toDelete = existing.filter((reminder) => {
      const url =
        reminder.metadata && typeof reminder.metadata === "object"
          ? String((reminder.metadata as any).url ?? "")
          : "";
      return url && !urls.has(url);
    });
    if (toDelete.length) {
      await this.reminders.delete(toDelete.map((reminder) => reminder.id));
    }

    const upserts: ReminderEntity[] = [];
    for (const link of expiryLinks) {
      const built = this.buildPlatformExpiryReminder(link, leadDays);
      if (!built) {
        continue;
      }

      const current = byUrl.get(link.url);
      if (current) {
        current.dueAt = built.dueAt;
        current.message = built.message;
        current.metadata = built.metadata;
        current.status = "PENDING";
        current.completedAt = null;
        current.dismissedAt = null;
        upserts.push(current);
      } else {
        upserts.push(
          this.reminders.create({
            userId,
            listingId,
            type: "PLATFORM_LISTING_EXPIRY",
            dueAt: built.dueAt,
            message: built.message,
            status: "PENDING",
            recurrence: "NONE",
            recurrenceInterval: 1,
            metadata: built.metadata,
          }),
        );
      }
    }

    const saved = upserts.length ? await this.reminders.save(upserts) : [];
    const persisted = await this.reminders.find({
      where: { userId, listingId, type: "PLATFORM_LISTING_EXPIRY" },
      relations: { listing: true },
      order: { dueAt: "ASC" },
      take: 250,
    });
    return persisted.map(toStoredReminder);
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
