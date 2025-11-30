export enum ListingStatus {
  ACTIVE = "Active",
  SOLD = "Sold",
  RENTED = "Rented",
  EXPIRED = "Expired",
  WITHDRAWN = "Withdrawn"
}

export enum ProcessStage {
  OWNER_APPOINTMENT = "Owner Appointment",
  MARKETING_ACTIVATION = "Marketing Activation",
  VIEWING_RECORD = "Viewing Record",
  OFFER_STAGE = "Offer Stage",
  LEGAL_STAGE = "Legal Stage",
  LOAN_CONSENT = "Loan/Consent Processing",
  KEY_HANDOVER = "Key Handover"
}

export enum SubscriptionStatus {
  TRIALING = "TRIALING",
  ACTIVE = "ACTIVE",
  PAST_DUE = "PAST_DUE",
  CANCELED = "CANCELED"
}

export type MediaAsset = {
  url: string;
  label?: string;
};

export type ExternalLink = {
  provider: "Mudah" | "PropertyGuru" | "Other";
  url: string;
  expiresAt?: Date;
};

export type Listing = {
  id: string;
  propertyName: string;
  type: string;
  price: number;
  size: number;
  bedrooms: number;
  bathrooms: number;
  location: string;
  status: ListingStatus;
  photos: MediaAsset[];
  videos: MediaAsset[];
  documents: MediaAsset[];
  externalLinks: ExternalLink[];
  createdAt: Date;
  updatedAt: Date;
};

export type ProcessLogEntry = {
  stage: ProcessStage;
  notes?: string;
  completedAt?: Date;
  actor?: string;
};

export type OwnerViewToken = {
  listingId: string;
  token: string;
  expiresAt: Date;
};

export type ReminderType =
  | "PORTAL_EXPIRY"
  | "EXCLUSIVE_APPOINTMENT"
  | "LEAD_FOLLOWUP"
  | "TENANCY_RENEWAL";

export type Reminder = {
  id: string;
  type: ReminderType;
  listingId?: string;
  contactId?: string;
  dueAt: Date;
  message: string;
};

export type HitPayWebhook =
  | {
      event: "payment.succeeded";
      data: { invoiceId: string; amount: number; currency: string };
    }
  | {
      event: "payment.failed";
      data: { invoiceId: string; amount: number; currency: string };
    }
  | {
      event: "subscription.canceled";
      data: { subscriptionId: string };
    };

export type CalculatorReceipt = {
  agentName: string;
  customerName?: string;
  renNumber: string;
  agencyLogoUrl?: string;
  calculationType:
    | "Loan Eligibility"
    | "SPA/MOT"
    | "Loan Agreement"
    | "ROI"
    | "Sellability"
    | "Land Feasibility"
    | "Tenancy Stamp Duty";
  inputs: Record<string, number | string | boolean>;
  outputs: Record<string, number | string>;
  issuedAt: Date;
};
