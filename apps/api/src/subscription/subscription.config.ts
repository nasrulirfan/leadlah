import { SubscriptionPlan } from "@leadlah/core";

const HITPAY_PROD_BASE_URL = "https://api.hit-pay.com/v1";
const HITPAY_SANDBOX_BASE_URL = "https://api.sandbox.hit-pay.com/v1";

export type HitpayConfig = {
  apiKey: string;
  baseUrl: string;
  signatureKey?: string;
  webhookUrl: string;
  defaultRedirectUrl: string;
  paymentMethods: string[];
};

export type SubscriptionConfig = {
  plan: SubscriptionPlan;
  hitpay: HitpayConfig | null;
};

const parseNumber = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function loadSubscriptionConfig(): SubscriptionConfig {
  const plan: SubscriptionPlan = {
    code: process.env.SUBSCRIPTION_PLAN_CODE ?? "leadlah-pro-monthly",
    name: process.env.SUBSCRIPTION_PLAN_NAME ?? "LeadLah Pro",
    description:
      process.env.SUBSCRIPTION_PLAN_DESCRIPTION ??
      "Unlimited listings, reminders, calculators, and owner reporting.",
    amount: parseNumber(process.env.SUBSCRIPTION_PLAN_AMOUNT, 129),
    currency: (process.env.SUBSCRIPTION_PLAN_CURRENCY ?? "MYR").toUpperCase(),
    interval: (process.env.SUBSCRIPTION_PLAN_INTERVAL ?? "monthly") === "yearly" ? "yearly" : "monthly",
    trialDays: Math.max(parseNumber(process.env.SUBSCRIPTION_TRIAL_DAYS, 7), 0),
    graceDays: Math.max(parseNumber(process.env.SUBSCRIPTION_GRACE_DAYS, 3), 0)
  };

  const apiKey = process.env.HITPAY_API_KEY;
  const webhookUrl = process.env.HITPAY_WEBHOOK_URL;

  // If HitPay is not configured (common in local dev), still return a valid
  // subscription plan so trialing flows can work without crashing the module.
  if (!apiKey || !webhookUrl) {
    return {
      plan,
      hitpay: null
    };
  }

  const signatureKey = process.env.HITPAY_SIGNATURE_KEY ?? process.env.HITPAY_WEBHOOK_SECRET;
  const mode = (process.env.HITPAY_MODE ?? "sandbox").toLowerCase();
  const baseUrl =
    process.env.HITPAY_BASE_URL ?? (mode === "production" ? HITPAY_PROD_BASE_URL : HITPAY_SANDBOX_BASE_URL);

  const defaultRedirectUrl =
    process.env.HITPAY_RETURN_URL ??
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000/billing";

  return {
    plan,
    hitpay: {
      apiKey,
      baseUrl,
      signatureKey,
      webhookUrl,
      defaultRedirectUrl,
      paymentMethods: (process.env.HITPAY_PAYMENT_METHODS ?? "")
        .split(",")
        .map((method) => method.trim())
        .filter(Boolean)
    }
  };
}
