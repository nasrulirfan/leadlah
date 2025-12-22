"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { requestApi } from "@/lib/api";

const reminderIdSchema = z.string().uuid();

export async function completeReminderAction(
  reminderId: string,
  _formData?: FormData,
) {
  const session = await requireSession();
  const parsedId = reminderIdSchema.parse(reminderId);
  await requestApi(`/reminders/${session.user.id}/${parsedId}/complete`, {
    method: "POST",
  });
  revalidatePath("/dashboard");
  revalidatePath("/appointments");
}

export async function dismissReminderAction(
  reminderId: string,
  _formData?: FormData,
) {
  const session = await requireSession();
  const parsedId = reminderIdSchema.parse(reminderId);
  await requestApi(`/reminders/${session.user.id}/${parsedId}/dismiss`, {
    method: "POST",
  });
  revalidatePath("/dashboard");
  revalidatePath("/appointments");
}
