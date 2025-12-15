import { SubscriptionStatus, type SubscriptionSummary } from "@leadlah/core";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type CheckoutResponse = {
  checkoutUrl: string;
};

const defaultPlan = {
  code: "leadlah-pro-monthly",
  name: "LeadLah Pro",
  description: "Unlimited listings, reminders, calculators, and owner reporting.",
  amount: 129,
  currency: "MYR",
  interval: "monthly" as const,
  trialDays: 7,
  graceDays: 3
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `Failed to call ${path}`);
  }

  return text ? (JSON.parse(text) as T) : ({} as T);
}

const parseDate = (value: unknown) => {
  if (!value) {
    return undefined;
  }
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export function getFallbackSummary(): SubscriptionSummary {
  const now = new Date();
  const trialEndsAt = defaultPlan.trialDays > 0 ? addDays(now, defaultPlan.trialDays) : undefined;
  return {
    plan: defaultPlan,
    billingProviderConfigured: false,
    subscription: {
      id: "fallback",
      status: SubscriptionStatus.TRIALING,
      trialEndsAt,
      nextBillingAt: trialEndsAt,
      graceEndsAt: undefined,
      canceledAt: undefined,
      providerReference: undefined,
      providerRecurringId: undefined,
      planAmount: defaultPlan.amount,
      planCurrency: defaultPlan.currency,
      planInterval: defaultPlan.interval
    },
    invoices: []
  };
}

export async function fetchSubscriptionSummary(userId: string): Promise<SubscriptionSummary> {
  const data = await request<SubscriptionSummary>(`/billing/${userId}`);
  return {
    plan: data.plan,
    billingProviderConfigured: data.billingProviderConfigured,
    subscription: {
      ...data.subscription,
      trialEndsAt: parseDate(data.subscription.trialEndsAt),
      nextBillingAt: parseDate(data.subscription.nextBillingAt),
      graceEndsAt: parseDate(data.subscription.graceEndsAt),
      canceledAt: parseDate(data.subscription.canceledAt)
    },
    invoices: data.invoices.map((invoice) => ({
      ...invoice,
      paidAt: parseDate(invoice.paidAt),
      failedAt: parseDate(invoice.failedAt),
      createdAt: parseDate(invoice.createdAt) ?? new Date(invoice.createdAt)
    }))
  };
}

export async function startTrial(userId: string) {
  return request(`/billing/${userId}/trial`, { method: "POST" });
}

export async function createCheckout(
  userId: string,
  payload: { customerEmail: string; customerName: string; redirectUrl?: string }
) {
  return request<CheckoutResponse>(`/billing/${userId}/checkout`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function retrySubscriptionCharge(userId: string) {
  return request(`/billing/${userId}/retry`, { method: "POST" });
}

export async function cancelSubscription(userId: string) {
  return request(`/billing/${userId}/cancel`, { method: "POST" });
}
