ALTER TABLE "leads"
  ADD COLUMN IF NOT EXISTS "phone_normalized" varchar(64),
  ADD COLUMN IF NOT EXISTS "email_normalized" varchar(255);
--> statement-breakpoint

UPDATE "leads"
SET "email_normalized" = LOWER(TRIM("email"))
WHERE "email" IS NOT NULL AND ("email_normalized" IS NULL OR "email_normalized" = '');
--> statement-breakpoint

UPDATE "leads"
SET "phone_normalized" = REGEXP_REPLACE("phone", '[^0-9]', '', 'g')
WHERE "phone" IS NOT NULL AND ("phone_normalized" IS NULL OR "phone_normalized" = '');
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_leads_user_phone_normalized" ON "leads" ("user_id", "phone_normalized");
CREATE INDEX IF NOT EXISTS "idx_leads_user_email_normalized" ON "leads" ("user_id", "email_normalized");

