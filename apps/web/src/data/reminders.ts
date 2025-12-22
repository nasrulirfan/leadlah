import { cache } from "react";
import { db } from "@/lib/db";
import type { ExternalLink } from "@leadlah/core";
import type { DashboardReminders, ReminderMetadata, ReminderRecurrence, ReminderStatus, StoredReminder } from "@/lib/reminders/types";
import { buildPlatformExpiryReminder, nextDueAt } from "@/lib/reminders/messages";
import { daysUntilSunday, zonedDateKey } from "@/lib/reminders/time";

type ReminderRow = {
  id: string;
  userId: string;
  listingId: string | null;
  type: string;
  dueAt: Date | string;
  message: string;
  status: ReminderStatus;
  recurrence: ReminderRecurrence;
  recurrenceInterval: number;
  metadata: ReminderMetadata | null;
  completedAt: Date | string | null;
  dismissedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  listingName: string | null;
};

const toDate = (value: Date | string | null | undefined) => {
  if (!value) {
    return undefined;
  }
  return value instanceof Date ? value : new Date(value);
};

const toReminder = (row: ReminderRow): StoredReminder => ({
  id: row.id,
  userId: row.userId,
  listingId: row.listingId ?? undefined,
  listingName: row.listingName ?? undefined,
  type: row.type,
  dueAt: toDate(row.dueAt) ?? new Date(),
  message: row.message,
  status: row.status,
  recurrence: row.recurrence,
  recurrenceInterval: Number(row.recurrenceInterval ?? 1),
  metadata: row.metadata ?? undefined,
  completedAt: toDate(row.completedAt),
  dismissedAt: toDate(row.dismissedAt),
  createdAt: toDate(row.createdAt) ?? new Date(),
  updatedAt: toDate(row.updatedAt) ?? new Date()
});

type CreateReminderInput = {
  userId: string;
  listingId?: string;
  type: string;
  dueAt: Date;
  message: string;
  metadata?: ReminderMetadata;
  recurrence?: ReminderRecurrence;
  recurrenceInterval?: number;
};

const reminderColumns =
  '"id", "userId", "listingId", type, "dueAt", message, status, recurrence, "recurrenceInterval", metadata, "completedAt", "dismissedAt", "createdAt", "updatedAt"';

const reminderSelectColumns =
  'r."id", r."userId", r."listingId", r.type, r."dueAt", r.message, r.status, r.recurrence, r."recurrenceInterval", r.metadata, r."completedAt", r."dismissedAt", r."createdAt", r."updatedAt"';

export async function createReminder(input: CreateReminderInput): Promise<StoredReminder> {
  const result = await db.query<ReminderRow>(
    `
      INSERT INTO "reminders"
        ("userId", "listingId", type, "dueAt", message, status, recurrence, "recurrenceInterval", metadata)
      VALUES
        ($1, $2, $3, $4, $5, 'PENDING', $6, $7, $8)
      RETURNING ${reminderColumns}
    `,
    [
      input.userId,
      input.listingId ?? null,
      input.type,
      input.dueAt,
      input.message,
      input.recurrence ?? "NONE",
      input.recurrenceInterval ?? 1,
      input.metadata ? JSON.stringify(input.metadata) : null
    ]
  );

  return toReminder({ ...result.rows[0], listingName: null });
}

export async function completeReminder(userId: string, reminderId: string) {
  const current = await db.query<Pick<ReminderRow, "id" | "recurrence" | "recurrenceInterval" | "dueAt"> & { status: ReminderStatus }>(
    `SELECT id, recurrence, "recurrenceInterval", "dueAt", status FROM "reminders" WHERE id = $1 AND "userId" = $2 LIMIT 1`,
    [reminderId, userId]
  );

  const row = current.rows[0];
  if (!row) {
    return null;
  }

  const dueAt = toDate(row.dueAt) ?? new Date();
  const recurrence = row.recurrence ?? "NONE";
  const interval = Number(row.recurrenceInterval ?? 1);
  if (recurrence !== "NONE") {
    const advancedDueAt = nextDueAt(dueAt, recurrence, interval);
    const updated = await db.query<ReminderRow>(
      `
        UPDATE "reminders"
        SET "dueAt" = $3, "completedAt" = NOW(), "updatedAt" = NOW()
        WHERE id = $1 AND "userId" = $2
        RETURNING ${reminderColumns}
      `,
      [reminderId, userId, advancedDueAt]
    );
    return updated.rows[0] ? toReminder({ ...updated.rows[0], listingName: null }) : null;
  }

  const updated = await db.query<ReminderRow>(
    `
      UPDATE "reminders"
      SET status = 'DONE', "completedAt" = NOW(), "updatedAt" = NOW()
      WHERE id = $1 AND "userId" = $2
      RETURNING ${reminderColumns}
    `,
    [reminderId, userId]
  );

  return updated.rows[0] ? toReminder({ ...updated.rows[0], listingName: null }) : null;
}

export async function dismissReminder(userId: string, reminderId: string) {
  const updated = await db.query<ReminderRow>(
    `
      UPDATE "reminders"
      SET status = 'DISMISSED', "dismissedAt" = NOW(), "updatedAt" = NOW()
      WHERE id = $1 AND "userId" = $2
      RETURNING ${reminderColumns}
    `,
    [reminderId, userId]
  );

  return updated.rows[0] ? toReminder({ ...updated.rows[0], listingName: null }) : null;
}

export const fetchDashboardReminders = cache(async (userId: string, timeZone: string): Promise<DashboardReminders> => {
  try {
    const now = new Date();
    const days = daysUntilSunday(now, timeZone);
    const end = new Date(now);
    end.setDate(end.getDate() + Math.max(days, 2));
    end.setHours(23, 59, 59, 999);

    const result = await db.query<ReminderRow>(
      `
        SELECT
          ${reminderSelectColumns},
          l."propertyName" AS "listingName"
        FROM "reminders" r
        LEFT JOIN "listings" l ON l.id = r."listingId"
        WHERE r."userId" = $1
          AND r.status = 'PENDING'
          AND r."dueAt" <= $2
        ORDER BY r."dueAt" ASC
        LIMIT 250
      `,
      [userId, end]
    );

    const items = result.rows.map(toReminder);
    const todayKey = zonedDateKey(now, timeZone);
    const tomorrowKey = zonedDateKey(new Date(now.getTime() + 24 * 60 * 60 * 1000), timeZone);

    const thisWeekKeys = new Set<string>();
    for (let offset = 2; offset <= days; offset += 1) {
      thisWeekKeys.add(zonedDateKey(new Date(now.getTime() + offset * 24 * 60 * 60 * 1000), timeZone));
    }

    const groups: DashboardReminders = { today: [], tomorrow: [], thisWeek: [] };
    for (const reminder of items) {
      const dueKey = zonedDateKey(reminder.dueAt, timeZone);
      if (dueKey === todayKey || reminder.dueAt.getTime() < now.getTime()) {
        groups.today.push(reminder);
      } else if (dueKey === tomorrowKey) {
        groups.tomorrow.push(reminder);
      } else if (thisWeekKeys.has(dueKey)) {
        groups.thisWeek.push(reminder);
      }
    }

    return groups;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes('relation "reminders" does not exist')) {
      return { today: [], tomorrow: [], thisWeek: [] };
    }
    throw error;
  }
});

export const fetchAppointmentReminders = cache(async (userId: string): Promise<StoredReminder[]> => {
  try {
    const result = await db.query<ReminderRow>(
      `
        SELECT
          ${reminderSelectColumns},
          l."propertyName" AS "listingName"
        FROM "reminders" r
        LEFT JOIN "listings" l ON l.id = r."listingId"
        WHERE r."userId" = $1
          AND r.type = ANY($2::text[])
        ORDER BY r."dueAt" DESC
        LIMIT 500
      `,
      [userId, ["LISTING_EVENT", "EXCLUSIVE_APPOINTMENT"]]
    );

    return result.rows.map(toReminder);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes('relation "reminders" does not exist')) {
      return [];
    }
    throw error;
  }
});

export async function syncPlatformExpiryReminders(params: {
  userId: string;
  listingId: string;
  externalLinks: ExternalLink[];
  leadDays?: number;
}) {
  const leadDays = params.leadDays ?? 1;
  const expiryLinks = params.externalLinks.filter((link) => link.expiresAt);
  const urls = expiryLinks.map((link) => link.url);

  const existing = await db.query<{ id: string; url: string | null }>(
    `
      SELECT id, (metadata->>'url')::text AS url
      FROM "reminders"
      WHERE "userId" = $1 AND "listingId" = $2 AND type = 'PLATFORM_LISTING_EXPIRY'
    `,
    [params.userId, params.listingId]
  );

  const existingByUrl = new Map(existing.rows.filter((row) => row.url).map((row) => [row.url as string, row.id]));
  const toDelete = existing.rows
    .filter((row) => row.url && !urls.includes(row.url))
    .map((row) => row.id);

  if (toDelete.length) {
    await db.query(`DELETE FROM "reminders" WHERE "userId" = $1 AND id = ANY($2::uuid[])`, [params.userId, toDelete]);
  }

  for (const link of expiryLinks) {
    const built = buildPlatformExpiryReminder(link, { leadDays });
    if (!built) {
      continue;
    }

    const existingId = existingByUrl.get(link.url);
    if (existingId) {
      await db.query(
        `
          UPDATE "reminders"
          SET "dueAt" = $3, message = $4, metadata = $5, status = 'PENDING', "updatedAt" = NOW()
          WHERE id = $1 AND "userId" = $2
        `,
        [existingId, params.userId, built.dueAt, built.message, JSON.stringify(built.metadata)]
      );
      continue;
    }

    await db.query(
      `
        INSERT INTO "reminders"
          ("userId", "listingId", type, "dueAt", message, status, recurrence, "recurrenceInterval", metadata)
        VALUES
          ($1, $2, 'PLATFORM_LISTING_EXPIRY', $3, $4, 'PENDING', 'NONE', 1, $5)
      `,
      [params.userId, params.listingId, built.dueAt, built.message, JSON.stringify(built.metadata)]
    );
  }
}
