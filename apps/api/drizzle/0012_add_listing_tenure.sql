ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "tenure" varchar(32) NOT NULL DEFAULT 'Freehold';
--> statement-breakpoint
