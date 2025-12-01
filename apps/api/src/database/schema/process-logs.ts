import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
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

export const processViewings = pgTable(
  "process_viewings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    processLogId: uuid("processLogId")
      .notNull()
      .references(() => processLogs.id, { onDelete: "cascade" }),
    listingId: uuid("listingId")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    phone: varchar("phone", { length: 32 }),
    email: varchar("email", { length: 120 }),
    notes: text("notes"),
    viewedAt: timestamp("viewedAt", { withTimezone: true }),
    isSuccessfulBuyer: boolean("isSuccessfulBuyer").default(false).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    listingIdx: index("process_viewings_listing_idx").on(table.listingId),
    processLogIdx: index("process_viewings_process_log_idx").on(table.processLogId)
  })
);

export type ProcessLog = typeof processLogs.$inferSelect;
export type NewProcessLog = typeof processLogs.$inferInsert;
export type ProcessViewing = typeof processViewings.$inferSelect;
export type NewProcessViewing = typeof processViewings.$inferInsert;
