"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { requestApi } from "@/lib/api";

const reminderIdSchema = z.string().uuid();

type ApiReminder = {
  id: string;
  userId: string;
  listingId?: string | null;
  listingName?: string | null;
  type: string;
  status: "PENDING" | "DONE" | "DISMISSED";
  dueAt: string;
  message: string;
  recurrence: "NONE" | "WEEKLY" | "MONTHLY";
  recurrenceInterval: number;
  metadata?: Record<string, unknown> | null;
  completedAt?: string | null;
  dismissedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function completeReminderAction(
  reminderId: string,
  _formData?: FormData,
) {
  const session = await requireSession();
  const parsedId = reminderIdSchema.parse(reminderId);
  const updated = await requestApi<ApiReminder>(
    `/reminders/${session.user.id}/${parsedId}/complete`,
    {
      method: "POST",
    },
  );
  revalidatePath("/dashboard");
  revalidatePath("/appointments");
  return updated;
}

export async function dismissReminderAction(
  reminderId: string,
  _formData?: FormData,
) {
  const session = await requireSession();
  const parsedId = reminderIdSchema.parse(reminderId);
  const updated = await requestApi<ApiReminder>(
    `/reminders/${session.user.id}/${parsedId}/dismiss`,
    {
      method: "POST",
    },
  );
  revalidatePath("/dashboard");
  revalidatePath("/appointments");
  return updated;
}

export type ReminderActionResult = ApiReminder;
