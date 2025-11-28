import {
  Listing,
  ListingStatus,
  ProcessLogEntry,
  ProcessStage,
  Reminder,
  SubscriptionState,
  generateOwnerViewToken
} from "@leadlah/core";
import { addDays } from "date-fns";

export const listings: Listing[] = [
  {
    id: "8e4e1b32-2c4c-4e4f-9b5a-1fd3c1f1a001",
    propertyName: "Seri Maya Condo",
    type: "Condominium",
    price: 950000,
    size: 1200,
    bedrooms: 3,
    bathrooms: 2,
    location: "Kuala Lumpur",
    status: ListingStatus.ACTIVE,
    photos: [{ url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85", label: "Living" }],
    videos: [],
    documents: [{ url: "https://example.com/title.pdf", label: "Title Deed" }],
    externalLinks: [
      { provider: "Mudah", url: "https://mudah.my/listing/seri-maya", expiresAt: addDays(new Date(), 60) }
    ],
    createdAt: addDays(new Date(), -10),
    updatedAt: new Date()
  },
  {
    id: "6a6c8d8e-c9ab-4de0-9b0a-20e40da7ab02",
    propertyName: "Damansara Heights Bungalow",
    type: "Landed",
    price: 3200000,
    size: 4800,
    bedrooms: 6,
    bathrooms: 6,
    location: "Damansara, Selangor",
    status: ListingStatus.ACTIVE,
    photos: [{ url: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e", label: "Facade" }],
    videos: [],
    documents: [],
    externalLinks: [
      { provider: "PropertyGuru", url: "https://propertyguru.com/listing/damansara", expiresAt: addDays(new Date(), 20) }
    ],
    createdAt: addDays(new Date(), -30),
    updatedAt: new Date()
  }
];

export const processLogs: Record<string, ProcessLogEntry[]> = {
  [listings[0].id]: [
    { stage: ProcessStage.OWNER_APPOINTMENT, completedAt: addDays(new Date(), -9), actor: "Alicia" },
    { stage: ProcessStage.MARKETING_ACTIVATION, completedAt: addDays(new Date(), -7), actor: "Alicia" },
    { stage: ProcessStage.VIEWING_RECORD, notes: "Prospect loves view", completedAt: addDays(new Date(), -2) }
  ],
  [listings[1].id]: [
    { stage: ProcessStage.OWNER_APPOINTMENT, completedAt: addDays(new Date(), -25), actor: "Irfan" },
    { stage: ProcessStage.MARKETING_ACTIVATION, completedAt: addDays(new Date(), -23), actor: "Irfan" },
    { stage: ProcessStage.VIEWING_RECORD, notes: "2 families viewed", completedAt: addDays(new Date(), -18) },
    { stage: ProcessStage.OFFER_STAGE, notes: "LOI at RM3.1M in review", completedAt: addDays(new Date(), -1) }
  ]
};

export const reminders: Reminder[] = [
  {
    id: "b6f77e0b-eee1-4c50-a3a1-223f870f17ac",
    type: "PORTAL_EXPIRY",
    listingId: listings[0].id,
    dueAt: addDays(new Date(), 3),
    message: "Mudah ad expiring in 3 days."
  },
  {
    id: "bfc4bf4d-7c6e-4e47-aea3-2180fc3a4dd5",
    type: "EXCLUSIVE_APPOINTMENT",
    listingId: listings[1].id,
    dueAt: addDays(new Date(), 5),
    message: "Exclusive appointment letter expires in 7 days."
  },
  {
    id: "7d2fc9b3-93e9-44e4-8c82-d66d69e1c35e",
    type: "TENANCY_RENEWAL",
    listingId: listings[0].id,
    dueAt: addDays(new Date(), 45),
    message: "Tenancy renewal alert. Engage tenant."
  }
];

export const subscriptionState: SubscriptionState = {
  status: "PAST_DUE",
  nextBillingAt: addDays(new Date(), 3)
};

export const billingHistory = [
  { id: "INV-1001", amount: 129, date: addDays(new Date(), -30), status: "Paid" },
  { id: "INV-1002", amount: 129, date: addDays(new Date(), -1), status: "Failed" }
];

export const ownerViewToken = generateOwnerViewToken(listings[0].id, 30);
