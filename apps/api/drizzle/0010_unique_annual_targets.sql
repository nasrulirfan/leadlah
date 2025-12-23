WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id,
      year
      ORDER BY updated_at DESC, created_at DESC, id DESC
    ) AS rn
  FROM targets
  WHERE month IS NULL
)
DELETE FROM targets
USING ranked
WHERE targets.id = ranked.id
  AND ranked.rn > 1;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_user_annual_year" ON "targets" USING btree ("user_id","year") WHERE "month" IS NULL;
--> statement-breakpoint
