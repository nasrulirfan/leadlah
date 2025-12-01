import { pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { listings } from "./listings";

export const processLogs = pgTable(
  "process_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listingId: uuid("listingId")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    stage: varchar("stage", { length: 64 }).notNull(),
    notes: text("notes"),
    actor: varchar("actor", { length: 120 }),
    completedAt: timestamp("completedAt", { withTimezone: true }),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    listingStageUnique: uniqueIndex("process_logs_listing_stage_idx").on(
      table.listingId,
      table.stage
    )
  })
);

export type ProcessLog = typeof processLogs.$inferSelect;
export type NewProcessLog = typeof processLogs.$inferInsert;
