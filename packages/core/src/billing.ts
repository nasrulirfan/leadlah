import { differenceInCalendarDays } from "date-fns";
import { SubscriptionStatus } from "./types";

export type SubscriptionPlan = {
  code: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  interval: "monthly" | "yearly";
  trialDays: number;
  graceDays: number;
};

export type SubscriptionState = {
  id: string;
  status: SubscriptionStatus;
  trialEndsAt?: Date;
  nextBillingAt?: Date;
  graceEndsAt?: Date;
  canceledAt?: Date;
  providerReference?: string;
  providerRecurringId?: string;
  planAmount: number;
  planCurrency: string;
  planInterval: string;
};

export type BillingInvoiceStatus = "Paid" | "Failed" | "Pending";

export type BillingInvoice = {
  id: string;
  userId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: BillingInvoiceStatus;
  paidAt?: Date;
  failedAt?: Date;
  providerPaymentId?: string;
  rawPayload?: Record<string, unknown>;
  createdAt: Date;
};

export type SubscriptionSummary = {
  subscription: SubscriptionState;
  invoices: BillingInvoice[];
  plan: SubscriptionPlan;
  // Indicates whether the external billing provider (HitPay) is configured.
  // When false or undefined, UI can show a lightweight hint that card setup
  // and retries may be unavailable in this environment.
  billingProviderConfigured?: boolean;
};

export type HitPayWebhook = {
  event: string;
  data: {
    id?: string;
    payment_id?: string;
    recurring_billing_id?: string;
    subscription_id?: string;
    reference?: string;
    amount?: number | string;
    currency?: string;
    status?: string;
    [key: string]: unknown;
  };
};

export function isAccessAllowed(state: SubscriptionState): boolean {
  return [SubscriptionStatus.TRIALING, SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE].includes(state.status);
}

export function daysLeft(date: Date): number {
  return differenceInCalendarDays(date, new Date());
}
