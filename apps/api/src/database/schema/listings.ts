import {
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} from "drizzle-orm/pg-core";
import { ListingStatus } from "@leadlah/core";

export const listings = pgTable("listings", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyName: varchar("propertyName", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(),
  price: numeric("price", { precision: 15, scale: 2 }).notNull(),
  size: numeric("size", { precision: 12, scale: 2 }).notNull(),
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: integer("bathrooms").notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default(ListingStatus.ACTIVE),
  photos: text("photos").notNull().default("[]"),
  videos: text("videos").notNull().default("[]"),
  documents: text("documents").notNull().default("[]"),
  externalLinks: text("externalLinks").notNull().default("[]"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull()
});

export type Listing = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;
