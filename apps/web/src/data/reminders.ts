import { cache } from "react";
import type { ExternalLink } from "@leadlah/core";
import { requestApi } from "@/lib/api";
import type {
  DashboardReminders,
  ReminderMetadata,
  ReminderRecurrence,
  ReminderStatus,
  StoredReminder,
} from "@/lib/reminders/types";

type ApiReminder = Omit<
  StoredReminder,
  "dueAt" | "completedAt" | "dismissedAt" | "createdAt" | "updatedAt"
> & {
  dueAt: string;
  completedAt?: string;
  dismissedAt?: string;
  createdAt: string;
  updatedAt: string;
};

const toDate = (value: string | Date | null | undefined) => {
  if (!value) {
    return undefined;
  }
  return value instanceof Date ? value : new Date(value);
};

const toReminder = (reminder: ApiReminder): StoredReminder => ({
  ...reminder,
  dueAt: toDate(reminder.dueAt) ?? new Date(),
  completedAt: toDate(reminder.completedAt),
  dismissedAt: toDate(reminder.dismissedAt),
  createdAt: toDate(reminder.createdAt) ?? new Date(),
  updatedAt: toDate(reminder.updatedAt) ?? new Date(),
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

export async function createReminder(input: CreateReminderInput): Promise<StoredReminder> {
  const created = await requestApi<ApiReminder>(`/reminders/${input.userId}`, {
    method: "POST",
    body: JSON.stringify({
      listingId: input.listingId,
      type: input.type,
      dueAt: input.dueAt.toISOString(),
      message: input.message,
      recurrence: input.recurrence,
      recurrenceInterval: input.recurrenceInterval,
      metadata: input.metadata,
    }),
  });

  return toReminder(created);
}

export async function completeReminder(userId: string, reminderId: string) {
  const updated = await requestApi<ApiReminder>(`/reminders/${userId}/${reminderId}/complete`, {
    method: "POST",
  });
  return toReminder(updated);
}

export async function dismissReminder(userId: string, reminderId: string) {
  const updated = await requestApi<ApiReminder>(`/reminders/${userId}/${reminderId}/dismiss`, {
    method: "POST",
  });
  return toReminder(updated);
}

export const fetchDashboardReminders = cache(async (userId: string, timeZone: string): Promise<DashboardReminders> => {
  const result = await requestApi<{
    today: ApiReminder[];
    tomorrow: ApiReminder[];
    thisWeek: ApiReminder[];
  }>(
    `/reminders/${userId}/dashboard?timeZone=${encodeURIComponent(timeZone)}`,
  );
  return {
    today: result.today.map(toReminder),
    tomorrow: result.tomorrow.map(toReminder),
    thisWeek: result.thisWeek.map(toReminder),
  };
});

export const fetchAppointmentReminders = cache(async (userId: string): Promise<StoredReminder[]> => {
  const [events, exclusives] = await Promise.all([
    requestApi<ApiReminder[]>(
      `/reminders/${userId}?type=${encodeURIComponent("LISTING_EVENT")}&limit=250`,
    ),
    requestApi<ApiReminder[]>(
      `/reminders/${userId}?type=${encodeURIComponent("EXCLUSIVE_APPOINTMENT")}&limit=250`,
    ),
  ]);

  return [...events, ...exclusives]
    .map(toReminder)
    .sort((a, b) => b.dueAt.getTime() - a.dueAt.getTime())
    .slice(0, 500);
});

export async function syncPlatformExpiryReminders(params: {
  userId: string;
  listingId: string;
  externalLinks: ExternalLink[];
  leadDays?: number;
}) {
  await requestApi(`/reminders/${params.userId}/platform-expiry/${params.listingId}/sync`, {
    method: "POST",
    body: JSON.stringify({
      externalLinks: params.externalLinks,
      leadDays: params.leadDays,
    }),
  });
}

export async function fetchReminders(
  userId: string,
  opts: {
    type?: string;
    status?: ReminderStatus;
    dueBefore?: Date;
    limit?: number;
  } = {},
) {
  const query = new URLSearchParams();
  if (opts.type) query.set("type", opts.type);
  if (opts.status) query.set("status", opts.status);
  if (opts.dueBefore) query.set("dueBefore", opts.dueBefore.toISOString());
  if (opts.limit) query.set("limit", String(opts.limit));
  const suffix = query.size ? `?${query.toString()}` : "";
  const reminders = await requestApi<ApiReminder[]>(`/reminders/${userId}${suffix}`);
  return reminders.map(toReminder);
}
