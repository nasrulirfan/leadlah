CREATE TABLE IF NOT EXISTS "leads" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" varchar(255) NOT NULL,
    "listing_id" uuid,
    "name" varchar(160) NOT NULL,
    "phone" varchar(40),
    "email" varchar(255),
    "source" varchar(64) NOT NULL DEFAULT 'manual',
    "status" varchar(32) NOT NULL DEFAULT 'NEW',
    "message" text,
    "last_contacted_at" timestamptz,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT "leads_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE set null ON UPDATE no action
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_leads_user_id" ON "leads" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_leads_user_status" ON "leads" ("user_id", "status");
CREATE INDEX IF NOT EXISTS "idx_leads_created_at" ON "leads" ("created_at");
--> statement-breakpoint

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
