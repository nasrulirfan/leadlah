ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "bankValue" numeric(15, 2);
--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "competitorPriceRange" varchar(255);
--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "lotUnitNo" varchar(120);
--> statement-breakpoint
