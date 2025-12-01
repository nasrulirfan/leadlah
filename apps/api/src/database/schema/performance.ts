import { ExpenseCategory } from "@leadlah/core";
import {
  date,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  index
} from "drizzle-orm/pg-core";
import { listings } from "./listings";

export const targets = pgTable(
  "targets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    year: integer("year").notNull(),
    month: integer("month"),
    targetUnits: integer("target_units").notNull().default(0),
    targetIncome: numeric("target_income", { precision: 12, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    uniqueUserPeriod: uniqueIndex("unique_user_period").on(table.userId, table.year, table.month),
    userIdx: index("idx_targets_user_id").on(table.userId),
    yearIdx: index("idx_targets_year").on(table.year)
  })
);

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    category: varchar("category", { length: 50 }).notNull().$type<ExpenseCategory>(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    description: text("description").notNull(),
    date: date("date").notNull(),
    receiptUrl: text("receipt_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    userIdx: index("idx_expenses_user_id").on(table.userId),
    dateIdx: index("idx_expenses_date").on(table.date),
    categoryIdx: index("idx_expenses_category").on(table.category)
  })
);

export const commissions = pgTable("commissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  listingId: uuid("listing_id").references(() => listings.id, { onDelete: "set null" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  closedDate: date("closed_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export type Target = typeof targets.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type Commission = typeof commissions.$inferSelect;
