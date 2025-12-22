CREATE TABLE IF NOT EXISTS "reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" varchar(255) NOT NULL,
	"listingId" uuid,
	"type" varchar(64) NOT NULL,
	"dueAt" timestamp with time zone NOT NULL,
	"message" text NOT NULL,
	"status" varchar(16) DEFAULT 'PENDING' NOT NULL,
	"recurrence" varchar(16) DEFAULT 'NONE' NOT NULL,
	"recurrenceInterval" integer DEFAULT 1 NOT NULL,
	"metadata" jsonb,
	"completedAt" timestamp with time zone,
	"dismissedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reminders" ADD CONSTRAINT "reminders_listingId_listings_id_fk" FOREIGN KEY ("listingId") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reminders_user_due_idx" ON "reminders" USING btree ("userId","status","dueAt");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reminders_listing_idx" ON "reminders" USING btree ("listingId");

