UPDATE "listings" SET "tenure" = 'Freehold' WHERE "tenure" IS NULL OR "tenure" NOT IN ('Freehold', 'Leasehold');
--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "tenure" SET DEFAULT 'Freehold';
--> statement-breakpoint
