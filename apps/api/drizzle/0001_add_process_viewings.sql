CREATE TABLE IF NOT EXISTS "process_viewings" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "processLogId" uuid NOT NULL,
    "listingId" uuid NOT NULL,
    "name" varchar(160) NOT NULL,
    "phone" varchar(32),
    "email" varchar(120),
    "notes" text,
    "viewedAt" timestamptz,
    "isSuccessfulBuyer" boolean DEFAULT false NOT NULL,
    "createdAt" timestamptz DEFAULT now() NOT NULL,
    "updatedAt" timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT "process_viewings_processLogId_process_logs_id_fk" FOREIGN KEY ("processLogId") REFERENCES "process_logs"("id") ON DELETE cascade ON UPDATE no action,
    CONSTRAINT "process_viewings_listingId_listings_id_fk" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE cascade ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "process_viewings_listing_idx" ON "process_viewings" ("listingId");
CREATE INDEX IF NOT EXISTS "process_viewings_process_log_idx" ON "process_viewings" ("processLogId");
