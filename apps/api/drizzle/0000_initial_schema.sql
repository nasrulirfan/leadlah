CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "listings" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "propertyName" varchar(255) NOT NULL,
    "type" varchar(100) NOT NULL,
    "price" numeric(15, 2) NOT NULL,
    "size" numeric(12, 2) NOT NULL,
    "bedrooms" integer NOT NULL,
    "bathrooms" integer NOT NULL,
    "location" varchar(255) NOT NULL,
    "status" varchar(32) DEFAULT 'Active' NOT NULL,
    "photos" text DEFAULT '[]' NOT NULL,
    "videos" text DEFAULT '[]' NOT NULL,
    "documents" text DEFAULT '[]' NOT NULL,
    "externalLinks" text DEFAULT '[]' NOT NULL,
    "createdAt" timestamptz DEFAULT now() NOT NULL,
    "updatedAt" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "process_logs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "listingId" uuid NOT NULL,
    "stage" varchar(64) NOT NULL,
    "notes" text,
    "actor" varchar(120),
    "completedAt" timestamptz,
    "createdAt" timestamptz DEFAULT now() NOT NULL,
    "updatedAt" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "process_logs_listingId_listings_id_fk" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE cascade ON UPDATE no action
);

CREATE UNIQUE INDEX IF NOT EXISTS "process_logs_listing_stage_idx" ON "process_logs" ("listingId","stage");

CREATE TABLE IF NOT EXISTS "targets" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" varchar(255) NOT NULL,
    "year" integer NOT NULL,
    "month" integer,
    "target_units" integer NOT NULL DEFAULT 0,
    "target_income" numeric(12, 2) NOT NULL DEFAULT 0,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "unique_user_period" UNIQUE ("user_id", "year", "month")
);

CREATE INDEX IF NOT EXISTS "idx_targets_user_id" ON "targets" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_targets_year" ON "targets" ("year");

CREATE TABLE IF NOT EXISTS "expenses" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" varchar(255) NOT NULL,
    "category" varchar(50) NOT NULL,
    "amount" numeric(10, 2) NOT NULL,
    "description" text NOT NULL,
    "date" date NOT NULL,
    "receipt_url" text,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_expenses_user_id" ON "expenses" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_expenses_date" ON "expenses" ("date");
CREATE INDEX IF NOT EXISTS "idx_expenses_category" ON "expenses" ("category");

CREATE TABLE IF NOT EXISTS "commissions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" varchar(255) NOT NULL,
    "listing_id" uuid,
    "amount" numeric(12, 2) NOT NULL,
    "closed_date" date NOT NULL,
    "notes" text,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "commissions_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE set null ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "idx_commissions_user_id" ON "commissions" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_commissions_closed_date" ON "commissions" ("closed_date");
CREATE INDEX IF NOT EXISTS "idx_commissions_listing_id" ON "commissions" ("listing_id");

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_targets_updated_at
  BEFORE UPDATE ON targets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE targets IS 'Monthly and annual sales targets set by agents';
COMMENT ON TABLE expenses IS 'Business expenses tracked by agents for profitability analysis';
COMMENT ON TABLE commissions IS 'Commission records from closed deals';
