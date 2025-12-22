CREATE TABLE IF NOT EXISTS "listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"propertyName" varchar(255) NOT NULL,
	"type" varchar(100) NOT NULL,
	"category" varchar(32) DEFAULT 'For Sale' NOT NULL,
	"price" numeric(15, 2) NOT NULL,
	"size" numeric(12, 2) NOT NULL,
	"bedrooms" integer NOT NULL,
	"bathrooms" integer NOT NULL,
	"location" varchar(255) NOT NULL,
	"buildingProject" varchar(255),
	"status" varchar(32) DEFAULT 'Active' NOT NULL,
	"expiresAt" timestamp with time zone,
	"lastEnquiryAt" timestamp with time zone,
	"photos" text DEFAULT '[]' NOT NULL,
	"videos" text DEFAULT '[]' NOT NULL,
	"documents" text DEFAULT '[]' NOT NULL,
	"externalLinks" text DEFAULT '[]' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "process_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listingId" uuid NOT NULL,
	"stage" varchar(64) NOT NULL,
	"notes" text,
	"actor" varchar(120),
	"completedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "process_viewings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"processLogId" uuid NOT NULL,
	"listingId" uuid NOT NULL,
	"name" varchar(160) NOT NULL,
	"phone" varchar(32),
	"email" varchar(120),
	"notes" text,
	"viewedAt" timestamp with time zone,
	"isSuccessfulBuyer" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "commissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"listing_id" uuid,
	"amount" numeric(12, 2) NOT NULL,
	"closed_date" date NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"category" varchar(50) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"description" text NOT NULL,
	"date" date NOT NULL,
	"receipt_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"year" integer NOT NULL,
	"month" integer,
	"target_units" integer DEFAULT 0 NOT NULL,
	"target_income" numeric(12, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscription_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscriptionId" uuid NOT NULL,
	"userId" varchar(255) NOT NULL,
	"providerPaymentId" varchar(160),
	"status" varchar(16) DEFAULT 'Pending' NOT NULL,
	"amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"currency" varchar(8) DEFAULT 'MYR' NOT NULL,
	"paidAt" timestamp with time zone,
	"failedAt" timestamp with time zone,
	"rawPayload" jsonb,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" varchar(255) NOT NULL,
	"providerReference" varchar(120) NOT NULL,
	"providerRecurringId" varchar(160),
	"status" varchar(24) DEFAULT 'TRIALING' NOT NULL,
	"planAmount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"planCurrency" varchar(8) DEFAULT 'MYR' NOT NULL,
	"planInterval" varchar(16) DEFAULT 'monthly' NOT NULL,
	"trialEndsAt" timestamp with time zone,
	"nextBillingAt" timestamp with time zone,
	"graceEndsAt" timestamp with time zone,
	"canceledAt" timestamp with time zone,
	"metadata" jsonb,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profiles" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(40),
	"agency" varchar(80),
	"role" varchar(80),
	"bio" text,
	"avatarUrl" text,
	"coverUrl" text,
	"timezone" varchar(64) NOT NULL,
	"language" varchar(64) NOT NULL,
	"whatsapp" varchar(40),
	"notifications" jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "process_logs" ADD CONSTRAINT "process_logs_listingId_listings_id_fk" FOREIGN KEY ("listingId") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "process_viewings" ADD CONSTRAINT "process_viewings_processLogId_process_logs_id_fk" FOREIGN KEY ("processLogId") REFERENCES "public"."process_logs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "process_viewings" ADD CONSTRAINT "process_viewings_listingId_listings_id_fk" FOREIGN KEY ("listingId") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "commissions" ADD CONSTRAINT "commissions_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscription_invoices" ADD CONSTRAINT "subscription_invoices_subscriptionId_subscriptions_id_fk" FOREIGN KEY ("subscriptionId") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "process_logs_listing_stage_idx" ON "process_logs" USING btree ("listingId","stage");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "process_viewings_listing_idx" ON "process_viewings" USING btree ("listingId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "process_viewings_process_log_idx" ON "process_viewings" USING btree ("processLogId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_expenses_user_id" ON "expenses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_expenses_date" ON "expenses" USING btree ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_expenses_category" ON "expenses" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_user_period" ON "targets" USING btree ("user_id","year","month");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_targets_user_id" ON "targets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_targets_year" ON "targets" USING btree ("year");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscription_invoices_subscription_idx" ON "subscription_invoices" USING btree ("subscriptionId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "subscription_invoices_payment_idx" ON "subscription_invoices" USING btree ("providerPaymentId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_user_idx" ON "subscriptions" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_provider_ref_idx" ON "subscriptions" USING btree ("providerReference");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_provider_recurring_idx" ON "subscriptions" USING btree ("providerRecurringId");