CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" varchar(255) NOT NULL,
    "providerReference" varchar(120) NOT NULL,
    "providerRecurringId" varchar(160),
    "status" varchar(24) NOT NULL DEFAULT 'TRIALING',
    "planAmount" numeric(10, 2) NOT NULL DEFAULT 0,
    "planCurrency" varchar(8) NOT NULL DEFAULT 'MYR',
    "planInterval" varchar(16) NOT NULL DEFAULT 'monthly',
    "trialEndsAt" timestamptz,
    "nextBillingAt" timestamptz,
    "graceEndsAt" timestamptz,
    "canceledAt" timestamptz,
    "metadata" jsonb,
    "createdAt" timestamptz NOT NULL DEFAULT now(),
    "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_user_idx" ON "subscriptions" ("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_provider_ref_idx" ON "subscriptions" ("providerReference");
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_provider_recurring_idx" ON "subscriptions" ("providerRecurringId");

CREATE TABLE IF NOT EXISTS "subscription_invoices" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "subscriptionId" uuid NOT NULL,
    "userId" varchar(255) NOT NULL,
    "providerPaymentId" varchar(160),
    "status" varchar(16) NOT NULL DEFAULT 'Pending',
    "amount" numeric(10, 2) NOT NULL DEFAULT 0,
    "currency" varchar(8) NOT NULL DEFAULT 'MYR',
    "paidAt" timestamptz,
    "failedAt" timestamptz,
    "rawPayload" jsonb,
    "createdAt" timestamptz NOT NULL DEFAULT now(),
    "updatedAt" timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT "subscription_invoices_subscriptionId_subscriptions_id_fk"
      FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE cascade ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "subscription_invoices_subscription_idx" ON "subscription_invoices" ("subscriptionId");
CREATE UNIQUE INDEX IF NOT EXISTS "subscription_invoices_payment_idx" ON "subscription_invoices" ("providerPaymentId");

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_invoices_updated_at
  BEFORE UPDATE ON subscription_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
