import { z } from "zod";
import {
  ListingCategory,
  ListingStatus,
  ListingTenure,
  ProcessStage,
  SubscriptionStatus,
} from "./types";

const urlLikeSchema = z
  .string()
  .min(4)
  .refine(
    (value) => /^(https?:\/\/)/i.test(value) || value.startsWith("data:"),
    {
      message: "Must be a valid URL",
    },
  );

const httpUrlSchema = z
  .string()
  .url()
  .refine((value) => /^(https?:\/\/)/i.test(value), {
    message: "Must be a valid http(s) URL",
  });

export const notificationPreferencesSchema = z.object({
  reminders: z.boolean(),
  smartDigest: z.boolean(),
  productUpdates: z.boolean(),
});

export const userProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6).max(40).optional(),
  agency: z.string().min(2).max(80).optional(),
  renNumber: z.string().min(3).max(40).optional(),
  agencyLogoUrl: httpUrlSchema.optional(),
  role: z.string().min(2).max(80).optional(),
  bio: z.string().max(280).optional(),
  avatarUrl: urlLikeSchema.optional(),
  coverUrl: urlLikeSchema.optional(),
  timezone: z.string().min(2),
  language: z.string().min(2),
  whatsapp: z.string().min(6).max(40).optional(),
  notifications: notificationPreferencesSchema,
});

export const userProfileUpdateSchema = userProfileSchema.omit({ id: true });

export const mediaAssetSchema = z.object({
  url: z.string().url(),
  label: z.string().optional(),
});

export const listingPhotoVariantSchema = z.object({
  key: z.string().min(1),
  width: z.number().int().nonnegative(),
  format: z.enum(["avif", "webp"]),
  kind: z.enum(["RESPONSIVE", "THUMBNAIL", "DOWNLOAD"]),
  bytes: z.number().int().nonnegative(),
});

export const listingOptimizedPhotoSchema = z.object({
  id: z.string().uuid(),
  alt: z.string().max(280).optional(),
  status: z.enum(["READY", "PROCESSING", "FAILED"]),
  error: z.string().max(400).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  variants: z.array(listingPhotoVariantSchema).default([]),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const listingPhotoSchema = z.union([
  mediaAssetSchema,
  listingOptimizedPhotoSchema,
]);

export const externalLinkSchema = z.object({
  provider: z.enum(["Mudah", "PropertyGuru", "iProperty", "Other"]),
  url: z.string().url(),
  expiresAt: z.coerce.date().optional(),
});

const allowedExternalLinkDomains = {
  Mudah: ["mudah.my", "mudah.com"],
  PropertyGuru: [
    "propertyguru.com",
    "propertyguru.com.my",
    "propertyguru.com.sg",
  ],
  iProperty: ["iproperty.com", "iproperty.com.my"],
  Other: [],
} as const satisfies Record<string, readonly string[]>;

const hostnameMatchesAllowedDomains = (
  hostname: string,
  domains: readonly string[],
) => {
  const normalizedHostname = hostname.toLowerCase().replace(/^www\./, "");
  return domains.some(
    (domain) =>
      normalizedHostname === domain ||
      normalizedHostname.endsWith(`.${domain}`),
  );
};

export const validatedExternalLinkSchema = externalLinkSchema.superRefine(
  (link, ctx) => {
    const domains = allowedExternalLinkDomains[link.provider] ?? [];
    if (link.provider === "Other" || domains.length === 0) {
      return;
    }

    let hostname = "";
    try {
      hostname = new URL(link.url).hostname;
    } catch {
      return;
    }

    if (!hostnameMatchesAllowedDomains(hostname, domains)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `URL must be a ${link.provider} link on ${domains.join(", ")}`,
        path: ["url"],
      });
    }
  },
);

export const listingSchema = z.object({
  id: z.string().uuid(),
  propertyName: z.string().min(2),
  lotUnitNo: z.string().min(1).max(120).optional(),
  type: z.string().min(2),
  category: z.nativeEnum(ListingCategory).default(ListingCategory.FOR_SALE),
  tenure: z.nativeEnum(ListingTenure).default(ListingTenure.FREEHOLD),
  price: z.number().nonnegative(),
  bankValue: z.number().nonnegative().optional(),
  competitorPriceRange: z.string().min(1).max(255).optional(),
  size: z.number().nonnegative(),
  bedrooms: z.number().int().nonnegative(),
  bathrooms: z.number().int().nonnegative(),
  location: z.string().min(3),
  buildingProject: z.string().min(2).max(255).optional(),
  status: z.nativeEnum(ListingStatus),
  expiresAt: z.coerce.date().optional(),
  lastEnquiryAt: z.coerce.date().optional(),
  photos: z.array(listingPhotoSchema).default([]),
  videos: z.array(mediaAssetSchema).default([]),
  documents: z.array(mediaAssetSchema).default([]),
  externalLinks: z.array(validatedExternalLinkSchema).default([]),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const processLogEntrySchema = z.object({
  stage: z.nativeEnum(ProcessStage),
  notes: z.string().optional(),
  completedAt: z.coerce.date().optional(),
  actor: z.string().optional(),
});

export const ownerViewTokenSchema = z.object({
  listingId: z.string().uuid(),
  token: z.string().min(16),
  expiresAt: z.coerce.date(),
});

export const reminderSchema = z.object({
  id: z.string().uuid(),
  type: z.enum([
    "PORTAL_EXPIRY",
    "EXCLUSIVE_APPOINTMENT",
    "LEAD_FOLLOWUP",
    "TENANCY_RENEWAL",
    "PLATFORM_LISTING_EXPIRY",
    "LISTING_EVENT",
    "OWNER_UPDATE",
  ]),
  listingId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  dueAt: z.coerce.date(),
  message: z.string().min(3),
});

export const subscriptionStatusSchema = z.nativeEnum(SubscriptionStatus);

export const listingSearchSchema = z
  .object({
    category: z.nativeEnum(ListingCategory).optional(),
    location: z.string().min(1).optional(),
    buildingProject: z.string().min(1).optional(),
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().nonnegative().optional(),
    status: z.nativeEnum(ListingStatus).optional(),
    propertyType: z.string().min(1).optional(),
    noEnquiryDays: z.coerce.number().int().nonnegative().optional(),
    expiringInDays: z.coerce.number().int().nonnegative().optional(),
  })
  .superRefine((values, ctx) => {
    if (
      values.minPrice != null &&
      values.maxPrice != null &&
      values.minPrice > values.maxPrice
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "minPrice must be less than or equal to maxPrice",
        path: ["minPrice"],
      });
    }
  });

export type ListingInput = z.infer<typeof listingSchema>;
export type ListingSearchInput = z.infer<typeof listingSearchSchema>;
export type ProcessLogInput = z.infer<typeof processLogEntrySchema>;
export type ReminderInput = z.infer<typeof reminderSchema>;
export type NotificationPreferencesInput = z.infer<
  typeof notificationPreferencesSchema
>;
export type UserProfileInput = z.infer<typeof userProfileSchema>;
export type UserProfileUpdateInput = z.infer<typeof userProfileUpdateSchema>;
