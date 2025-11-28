import { z } from "zod";
import { ListingStatus, ProcessStage, SubscriptionStatus } from "./types";

export const mediaAssetSchema = z.object({
  url: z.string().url(),
  label: z.string().optional()
});

export const externalLinkSchema = z.object({
  provider: z.enum(["Mudah", "PropertyGuru", "Other"]),
  url: z.string().url(),
  expiresAt: z.coerce.date().optional()
});

export const listingSchema = z.object({
  id: z.string().uuid(),
  propertyName: z.string().min(2),
  type: z.string().min(2),
  price: z.number().nonnegative(),
  size: z.number().nonnegative(),
  bedrooms: z.number().int().nonnegative(),
  bathrooms: z.number().int().nonnegative(),
  location: z.string().min(3),
  status: z.nativeEnum(ListingStatus),
  photos: z.array(mediaAssetSchema).default([]),
  videos: z.array(mediaAssetSchema).default([]),
  documents: z.array(mediaAssetSchema).default([]),
  externalLinks: z.array(externalLinkSchema).default([]),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
});

export const processLogEntrySchema = z.object({
  stage: z.nativeEnum(ProcessStage),
  notes: z.string().optional(),
  completedAt: z.coerce.date().optional(),
  actor: z.string().optional()
});

export const ownerViewTokenSchema = z.object({
  listingId: z.string().uuid(),
  token: z.string().min(16),
  expiresAt: z.coerce.date()
});

export const reminderSchema = z.object({
  id: z.string().uuid(),
  type: z.enum([
    "PORTAL_EXPIRY",
    "EXCLUSIVE_APPOINTMENT",
    "LEAD_FOLLOWUP",
    "TENANCY_RENEWAL"
  ]),
  listingId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  dueAt: z.coerce.date(),
  message: z.string().min(3)
});

export const subscriptionStatusSchema = z.nativeEnum(SubscriptionStatus);

export type ListingInput = z.infer<typeof listingSchema>;
export type ProcessLogInput = z.infer<typeof processLogEntrySchema>;
export type ReminderInput = z.infer<typeof reminderSchema>;
