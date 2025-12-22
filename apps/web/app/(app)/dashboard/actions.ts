"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { completeReminder, dismissReminder } from "@/data/reminders";

const reminderIdSchema = z.string().uuid();

export async function completeReminderAction(reminderId: string, _formData?: FormData) {
  const session = await requireSession();
  const parsedId = reminderIdSchema.parse(reminderId);
  await completeReminder(session.user.id, parsedId);
  revalidatePath("/dashboard");
}

export async function dismissReminderAction(reminderId: string, _formData?: FormData) {
  const session = await requireSession();
  const parsedId = reminderIdSchema.parse(reminderId);
  await dismissReminder(session.user.id, parsedId);
  revalidatePath("/dashboard");
}

