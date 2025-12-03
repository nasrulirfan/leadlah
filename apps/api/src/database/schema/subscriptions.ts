import {
  index,
  jsonb,
  numeric,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("userId", { length: 255 }).notNull(),
    providerReference: varchar("providerReference", { length: 120 }).notNull(),
    providerRecurringId: varchar("providerRecurringId", { length: 160 }),
    status: varchar("status", { length: 24 }).notNull().default("TRIALING"),
    planAmount: numeric("planAmount", { precision: 10, scale: 2 }).notNull().default("0"),
    planCurrency: varchar("planCurrency", { length: 8 }).notNull().default("MYR"),
    planInterval: varchar("planInterval", { length: 16 }).notNull().default("monthly"),
    trialEndsAt: timestamp("trialEndsAt", { withTimezone: true }),
    nextBillingAt: timestamp("nextBillingAt", { withTimezone: true }),
    graceEndsAt: timestamp("graceEndsAt", { withTimezone: true }),
    canceledAt: timestamp("canceledAt", { withTimezone: true }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    userIdx: uniqueIndex("subscriptions_user_idx").on(table.userId),
    providerReferenceIdx: uniqueIndex("subscriptions_provider_ref_idx").on(table.providerReference),
    providerRecurringIdx: uniqueIndex("subscriptions_provider_recurring_idx").on(table.providerRecurringId)
  })
);

export const subscriptionInvoices = pgTable(
  "subscription_invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subscriptionId: uuid("subscriptionId")
      .notNull()
      .references(() => subscriptions.id, { onDelete: "cascade" }),
    userId: varchar("userId", { length: 255 }).notNull(),
    providerPaymentId: varchar("providerPaymentId", { length: 160 }),
    status: varchar("status", { length: 16 }).notNull().default("Pending"),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull().default("0"),
    currency: varchar("currency", { length: 8 }).notNull().default("MYR"),
    paidAt: timestamp("paidAt", { withTimezone: true }),
    failedAt: timestamp("failedAt", { withTimezone: true }),
    rawPayload: jsonb("rawPayload"),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => ({
    subscriptionIdx: index("subscription_invoices_subscription_idx").on(table.subscriptionId),
    providerPaymentIdx: uniqueIndex("subscription_invoices_payment_idx").on(table.providerPaymentId)
  })
);

export type Subscription = typeof subscriptions.$inferSelect;
export type SubscriptionInvoice = typeof subscriptionInvoices.$inferSelect;
