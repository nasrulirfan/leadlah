import { integer, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { listings } from "./listings";

export const reminders = pgTable("reminders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("userId", { length: 255 }).notNull(),
  listingId: uuid("listingId").references(() => listings.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 64 }).notNull(),
  dueAt: timestamp("dueAt", { withTimezone: true }).notNull(),
  message: text("message").notNull(),
  status: varchar("status", { length: 16 }).notNull().default("PENDING"),
  recurrence: varchar("recurrence", { length: 16 }).notNull().default("NONE"),
  recurrenceInterval: integer("recurrenceInterval").notNull().default(1),
  metadata: jsonb("metadata"),
  completedAt: timestamp("completedAt", { withTimezone: true }),
  dismissedAt: timestamp("dismissedAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull()
});

export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;

