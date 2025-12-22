ALTER TABLE "listings"
  ADD COLUMN IF NOT EXISTS "category" varchar(32) NOT NULL DEFAULT 'For Sale',
  ADD COLUMN IF NOT EXISTS "buildingProject" varchar(255),
  ADD COLUMN IF NOT EXISTS "expiresAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "lastEnquiryAt" timestamptz;

UPDATE "listings"
SET "category" = 'Sold'
WHERE "status" = 'Sold' AND "category" = 'For Sale';

UPDATE "listings"
SET "category" = 'Rented'
WHERE "status" = 'Rented' AND "category" = 'For Sale';

CREATE INDEX IF NOT EXISTS "idx_listings_category" ON "listings" ("category");
CREATE INDEX IF NOT EXISTS "idx_listings_status" ON "listings" ("status");
CREATE INDEX IF NOT EXISTS "idx_listings_expiresAt" ON "listings" ("expiresAt");
CREATE INDEX IF NOT EXISTS "idx_listings_lastEnquiryAt" ON "listings" ("lastEnquiryAt");
