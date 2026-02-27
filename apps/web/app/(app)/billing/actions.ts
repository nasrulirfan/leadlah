"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import {
  cancelSubscription,
  createCheckout,
  retrySubscriptionCharge,
  startTrial
} from "@/data/subscription";

const BILLING_PATH = "/billing";

const resolveReturnBase = () => {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    process.env.BETTER_AUTH_URL ??
    "http://localhost:3000";
  return base.replace(/\/$/, "");
};

export async function startTrialAction() {
  const session = await requireSession();
  await startTrial(session.user.id);
  revalidatePath(BILLING_PATH);
}

export async function startCheckoutAction() {
  const session = await requireSession();
  const { checkoutUrl } = await createCheckout(session.user.id, {
    customerEmail: session.user.email ?? "billing@leadlah.com",
    customerName: session.user.name ?? "LeadLah Agent",
    redirectUrl: `${resolveReturnBase()}${BILLING_PATH}`
  });

  new URL(checkoutUrl);
  redirect(checkoutUrl as Route);
}

export async function retryPaymentAction() {
  const session = await requireSession();
  await retrySubscriptionCharge(session.user.id);
  revalidatePath(BILLING_PATH);
}

export async function cancelSubscriptionAction() {
  const session = await requireSession();
  await cancelSubscription(session.user.id);
  revalidatePath(BILLING_PATH);
}
