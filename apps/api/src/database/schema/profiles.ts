import { jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  agency: varchar("agency", { length: 80 }),
  renNumber: varchar("renNumber", { length: 40 }),
  agencyLogoUrl: text("agencyLogoUrl"),
  role: varchar("role", { length: 80 }),
  bio: text("bio"),
  avatarUrl: text("avatarUrl"),
  coverUrl: text("coverUrl"),
  timezone: varchar("timezone", { length: 64 }).notNull(),
  language: varchar("language", { length: 64 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 40 }),
  notifications: jsonb("notifications").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Profile = typeof profiles.$inferSelect;
