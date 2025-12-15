import Link from "next/link";
import { SubscriptionStatus, type SubscriptionSummary } from "@leadlah/core";
import { requireSession } from "@/lib/session";
import { fetchSubscriptionSummary, getFallbackSummary } from "@/data/subscription";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  cancelSubscriptionAction,
  retryPaymentAction,
  startCheckoutAction,
  startTrialAction
} from "./actions";

const formatAmount = (value: number, currency: string) =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency
  }).format(value);

const statusTone: Record<SubscriptionStatus, "success" | "warning" | "danger" | "neutral"> = {
  [SubscriptionStatus.TRIALING]: "warning",
  [SubscriptionStatus.ACTIVE]: "success",
  [SubscriptionStatus.PAST_DUE]: "danger",
  [SubscriptionStatus.CANCELED]: "neutral"
};

const invoiceTone = {
  Paid: "success",
  Failed: "danger",
  Pending: "warning"
} as const;

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const session = await requireSession();
  let summary: SubscriptionSummary;
  let billingUnavailable = false;
  try {
    summary = await fetchSubscriptionSummary(session.user.id);
  } catch (error) {
    console.error("Unable to load subscription summary:", error);
    summary = getFallbackSummary();
    billingUnavailable = true;
  }
  const { subscription, plan, invoices, billingProviderConfigured } = summary;

  const paymentFailed = subscription.status === SubscriptionStatus.PAST_DUE;
  const now = new Date();
  const hasTrialWindow = !!subscription.trialEndsAt;
  const trialActive = hasTrialWindow && subscription.trialEndsAt! > now;
  const canStartTrial = !hasTrialWindow && subscription.status !== SubscriptionStatus.ACTIVE;
  const hasRecurringBilling = !!subscription.providerRecurringId;
  const isSubscribedWithTrial = hasRecurringBilling && subscription.status === SubscriptionStatus.TRIALING;
  const statusLabel = isSubscribedWithTrial ? "Subscribed" : subscription.status;
  const statusToneKey = isSubscribedWithTrial ? "success" : statusTone[subscription.status];
  const nextBillingLabel =
    subscription.nextBillingAt?.toLocaleDateString() ??
    subscription.trialEndsAt?.toLocaleDateString() ??
    "Not scheduled";
  const latestFailed = invoices.find((invoice) => invoice.status === "Failed");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Subscription & Billing</h1>
          <p className="text-sm text-muted-foreground">Manage plan, invoices, and payment method via HitPay.</p>
        </div>
        <Button variant="secondary" size="sm">Contact Support</Button>
      </div>

      {billingUnavailable && (
        <Card className="border-amber-200 bg-amber-50 text-amber-900">
          <p className="text-sm font-semibold">Billing service is temporarily unavailable. Showing cached defaults.</p>
          <p className="text-xs text-amber-800">
            Ensure the API is running on {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"} with the latest
            migrations.
          </p>
        </Card>
      )}

      {!billingUnavailable && billingProviderConfigured === false && (
        <Card className="border-amber-200 bg-amber-50 text-amber-900">
          <p className="text-sm font-semibold">HitPay is not configured for this environment.</p>
          <p className="text-xs text-amber-800">
            You can start a free trial, but card setup and payment retries will only work after HitPay keys are added to
            the API environment.
          </p>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm font-semibold text-muted-foreground">Current Status</p>
          <div className="mt-2 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Badge tone={statusToneKey}>{statusLabel}</Badge>
              <span className="text-xs text-muted-foreground">Next billing: {nextBillingLabel}</span>
            </div>
            {subscription.graceEndsAt && (
              <p className="text-xs text-muted-foreground">
                Grace period ends {subscription.graceEndsAt.toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <p>Unlimited Listings</p>
            <p>Branded PDF Receipts</p>
            <p>Fishbone Tracker & Reminders</p>
          </div>
        </Card>

        <Card className="md:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">{plan.name}</p>
              <p className="text-3xl font-bold text-foreground">
                {formatAmount(plan.amount, plan.currency)}{" "}
                <span className="text-base font-semibold text-muted-foreground">/ {plan.interval}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                {plan.description ?? "Full LeadLah workspace access."}
              </p>
            </div>
            <div className="flex gap-3">
              {canStartTrial && (
                <form action={startTrialAction}>
                  <Button
                    variant="secondary"
                    type="submit"
                    disabled={billingUnavailable || billingProviderConfigured === false}
                  >
                    Start 7-Day Free Trial
                  </Button>
                </form>
              )}
              {!canStartTrial && trialActive && subscription.trialEndsAt && (
                <Button variant="secondary" type="button" disabled>
                  Trial ends {subscription.trialEndsAt.toLocaleDateString()}
                </Button>
              )}
              <form action={startCheckoutAction}>
                <Button
                  type="submit"
                  disabled={billingUnavailable || billingProviderConfigured === false}
                >
                  {subscription.providerRecurringId ? "Update Payment Method" : "Set Up Payment Method"}
                </Button>
              </form>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            HitPay powers recurring billing with FPX & Card support. Cancellations are immediate; access switches to
            read-only.
          </p>
        </Card>
      </div>

      {paymentFailed && (
        <Card className="border-red-200 bg-red-50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-red-800">Payment Failed</h3>
              <p className="text-sm text-red-700">Retry payment or update card to continue access.</p>
              {latestFailed && (
                <p className="text-sm font-semibold text-red-800">
                  Failed invoice: {formatAmount(latestFailed.amount, latestFailed.currency)}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <form action={retryPaymentAction}>
                <Button
                  variant="secondary"
                  className="border-red-200 text-red-700"
                  type="submit"
                  disabled={billingUnavailable || billingProviderConfigured === false}
                >
                  Retry Payment
                </Button>
              </form>
              <form action={startCheckoutAction}>
                <Button
                  variant="danger"
                  type="submit"
                  disabled={billingUnavailable || billingProviderConfigured === false}
                >
                  Update Card
                </Button>
              </form>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Invoice History</h3>
          <Button variant="secondary" size="sm" disabled>
            Download All
          </Button>
        </div>
        <div className="mt-4 divide-y divide-slate-100 text-sm">
          {invoices.length === 0 && (
            <p className="py-6 text-center text-muted-foreground">No invoices issued yet.</p>
          )}
          {invoices.map((invoice) => (
            <div key={invoice.id} className="flex flex-wrap items-center justify-between py-3">
              <div>
                <p className="font-semibold text-slate-800">{invoice.providerPaymentId ?? invoice.id}</p>
                <p className="text-xs text-muted-foreground">{invoice.createdAt.toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-800">{formatAmount(invoice.amount, invoice.currency)}</span>
                <Badge tone={invoiceTone[invoice.status]}>{invoice.status}</Badge>
                <Link
                  href="#"
                  aria-disabled
                  className="cursor-not-allowed text-muted-foreground"
                  title="Invoice PDFs will be available after accounting integration."
                >
                  Download
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        <form action={cancelSubscriptionAction}>
          <Button variant="ghost" className="text-muted-foreground" type="submit">
            Cancel Subscription
          </Button>
        </form>
      </div>
    </div>
  );
}
