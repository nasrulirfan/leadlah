"use server";

import type { ListingInput } from "@leadlah/core";
import { listingSchema } from "@leadlah/core";
import { z } from "zod";
import { revalidatePath } from "next/cache";

import { insertListing, removeListing, updateListing, updateListingCategory, updateListingStatus } from "@/data/listings";
import { syncPlatformExpiryReminders } from "@/data/reminders";
import { createReminder } from "@/data/reminders";
import { listingFormSchema, type ListingFormValues } from "@/lib/listings/form";
import { requireSession } from "@/lib/session";
import { buildFollowUpReminder, buildListingEventReminder, buildOwnerUpdateReminder, defaultOwnerUpdateDueAt } from "@/lib/reminders/messages";

const LISTINGS_PATH = "/listings";

export async function createListingAction(values: ListingFormValues) {
  const session = await requireSession();
  const payload = listingFormSchema.parse(values);
  const listing = await insertListing(payload);
  await syncPlatformExpiryReminders({
    userId: session.user.id,
    listingId: listing.id,
    externalLinks: listing.externalLinks ?? []
  });
  revalidatePath(LISTINGS_PATH);
  return listing;
}

export async function updateListingStatusAction(params: { id: string; status: ListingInput["status"] }) {
  await requireSession();
  const id = listingSchema.shape.id.parse(params.id);
  const status = listingSchema.shape.status.parse(params.status);
  const listing = await updateListingStatus(id, status);
  revalidatePath(LISTINGS_PATH);
  return listing;
}

export async function updateListingCategoryAction(params: { id: string; category: ListingInput["category"] }) {
  await requireSession();
  const id = listingSchema.shape.id.parse(params.id);
  const category = listingSchema.shape.category.parse(params.category);
  const listing = await updateListingCategory(id, category);
  revalidatePath(LISTINGS_PATH);
  return listing;
}

export async function deleteListingAction(id: string) {
  await requireSession();
  const parsedId = listingSchema.shape.id.parse(id);
  const result = await removeListing(parsedId);
  revalidatePath(LISTINGS_PATH);
  return result;
}

export async function updateListingAction(id: string, values: ListingFormValues) {
  const session = await requireSession();
  const parsedId = listingSchema.shape.id.parse(id);
  const payload = listingFormSchema.parse(values);
  const listing = await updateListing(parsedId, payload);
  if (listing) {
    await syncPlatformExpiryReminders({
      userId: session.user.id,
      listingId: listing.id,
      externalLinks: listing.externalLinks ?? []
    });
  }
  revalidatePath(LISTINGS_PATH);
  return listing;
}

const listingReminderCreateSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("EVENT"),
    listingId: z.string().uuid(),
    eventType: z.enum(["Viewing", "Inspection", "Appointment"]),
    startsAt: z.coerce.date(),
    location: z.string().max(160).optional(),
    contactName: z.string().max(120).optional(),
    addConfirmation: z.boolean().default(false)
  }),
  z.object({
    kind: z.literal("FOLLOW_UP"),
    listingId: z.string().uuid(),
    dueAt: z.coerce.date(),
    message: z.string().min(3).max(280),
    contactName: z.string().max(120).optional(),
    channel: z.enum(["Call", "WhatsApp", "Email"]).optional()
  }),
  z.object({
    kind: z.literal("OWNER_UPDATE"),
    listingId: z.string().uuid(),
    cadence: z.enum(["Weekly", "Monthly"]),
    firstDueAt: z.coerce.date().optional(),
    message: z.string().min(3).max(280)
  })
]);

export async function createListingReminderAction(payload: unknown) {
  const session = await requireSession();
  const parsed = listingReminderCreateSchema.parse(payload);

  if (parsed.kind === "EVENT") {
    const baseDueAt = parsed.startsAt;
    const event = buildListingEventReminder({
      eventType: parsed.eventType,
      dueAt: baseDueAt,
      contactName: parsed.contactName,
      location: parsed.location
    });

    await createReminder({
      userId: session.user.id,
      listingId: parsed.listingId,
      type: "LISTING_EVENT",
      dueAt: baseDueAt,
      message: event.message,
      metadata: event.metadata
    });

    if (parsed.addConfirmation) {
      const confirmAt = new Date(baseDueAt.getTime() - 24 * 60 * 60 * 1000);
      const followUp = buildFollowUpReminder({ contactName: parsed.contactName, channel: "WhatsApp" });
      await createReminder({
        userId: session.user.id,
        listingId: parsed.listingId,
        type: "LEAD_FOLLOWUP",
        dueAt: confirmAt,
        message: `Confirm tomorrow’s ${parsed.eventType.toLowerCase()} appointment.`,
        metadata: followUp.metadata
      });
    }
  }

  if (parsed.kind === "FOLLOW_UP") {
    await createReminder({
      userId: session.user.id,
      listingId: parsed.listingId,
      type: "LEAD_FOLLOWUP",
      dueAt: parsed.dueAt,
      message: parsed.message,
      metadata: buildFollowUpReminder({ contactName: parsed.contactName, channel: parsed.channel }).metadata
    });
  }

  if (parsed.kind === "OWNER_UPDATE") {
    const recurrence = parsed.cadence === "Weekly" ? "WEEKLY" : "MONTHLY";
    const dueAt = parsed.firstDueAt ?? defaultOwnerUpdateDueAt(new Date(), recurrence);
    const ownerUpdate = buildOwnerUpdateReminder({
      cadence: parsed.cadence,
      recommendation: parsed.message
    });

    await createReminder({
      userId: session.user.id,
      listingId: parsed.listingId,
      type: "OWNER_UPDATE",
      dueAt,
      message: ownerUpdate.message,
      metadata: ownerUpdate.metadata,
      recurrence,
      recurrenceInterval: 1
    });
  }

  revalidatePath("/dashboard");
  revalidatePath(LISTINGS_PATH);
  return { ok: true };
}
