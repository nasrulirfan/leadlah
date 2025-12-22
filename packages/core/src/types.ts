export enum ListingStatus {
  ACTIVE = "Active",
  SOLD = "Sold",
  RENTED = "Rented",
  EXPIRED = "Expired",
  WITHDRAWN = "Withdrawn"
}

export enum ListingCategory {
  FOR_SALE = "For Sale",
  FOR_RENT = "For Rent",
  FOR_SALE_AND_RENT = "For Sale & Rent",
  SOLD = "Sold",
  RENTED = "Rented",
  HOLD_FOR_SALE = "Hold for Sale",
  BOOKED = "Booked",
  OFF_MARKET = "Off-Market"
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
  category: ListingCategory;
  price: number;
  size: number;
  bedrooms: number;
  bathrooms: number;
  location: string;
  buildingProject?: string;
  status: ListingStatus;
  expiresAt?: Date;
  lastEnquiryAt?: Date;
  photos: MediaAsset[];
  videos: MediaAsset[];
  documents: MediaAsset[];
  externalLinks: ExternalLink[];
  createdAt: Date;
  updatedAt: Date;
};

export type ViewingCustomer = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  viewedAt?: Date;
};

export type ProcessLogEntry = {
  stage: ProcessStage;
  notes?: string;
  completedAt?: Date;
  actor?: string;
  viewings?: ViewingCustomer[];
  successfulBuyerId?: string;
};

export type OwnerViewToken = {
  listingId: string;
  token: string;
  expiresAt: Date;
};

export type NotificationPreferences = {
  reminders: boolean;
  smartDigest: boolean;
  productUpdates: boolean;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  agency?: string;
  role?: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  timezone: string;
  language: string;
  whatsapp?: string;
  notifications: NotificationPreferences;
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

export enum ExpenseCategory {
  FUEL = "Fuel",
  ADVERTISING = "Advertising",
  ENTERTAINMENT = "Client Entertainment",
  PRINTING = "Printing",
  TRANSPORTATION = "Transportation",
  OFFICE = "Office Supplies",
  PROFESSIONAL_FEES = "Professional Fees",
  OTHER = "Other"
}

export type Target = {
  id: string;
  userId: string;
  year: number;
  month?: number;
  targetUnits: number;
  targetIncome: number;
  createdAt: Date;
  updatedAt: Date;
};

export type Expense = {
  id: string;
  userId: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  date: Date;
  receiptUrl?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Commission = {
  id: string;
  userId: string;
  listingId: string;
  amount: number;
  closedDate: Date;
  notes?: string;
  createdAt: Date;
};

export type PerformanceMetrics = {
  period: { year: number; month?: number };
  target: { units: number; income: number };
  actual: {
    units: number;
    commission: number;
    expenses: number;
    netIncome: number;
  };
  progress: {
    unitsPercent: number;
    incomePercent: number;
  };
};
