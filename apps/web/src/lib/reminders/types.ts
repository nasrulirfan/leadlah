import type { ReminderType } from "@leadlah/core";

export type ReminderStatus = "PENDING" | "DONE" | "DISMISSED";
export type ReminderRecurrence = "NONE" | "WEEKLY" | "MONTHLY";

export type ReminderMetadata =
  | {
      kind: "PLATFORM_EXPIRY";
      provider: string;
      url?: string;
      expiresAt?: string;
      leadDays?: number;
    }
  | {
      kind: "EVENT";
      eventType: "Viewing" | "Inspection" | "Appointment";
      location?: string;
      contactName?: string;
    }
  | {
      kind: "FOLLOW_UP";
      contactName?: string;
      channel?: "Call" | "WhatsApp" | "Email";
    }
  | {
      kind: "OWNER_UPDATE";
      cadence: "Weekly" | "Monthly";
      recommendation?: string;
    }
  | Record<string, unknown>;

export type StoredReminder = {
  id: string;
  userId: string;
  listingId?: string;
  listingName?: string;
  type: ReminderType | (string & {});
  status: ReminderStatus;
  dueAt: Date;
  message: string;
  recurrence: ReminderRecurrence;
  recurrenceInterval: number;
  metadata?: ReminderMetadata;
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

