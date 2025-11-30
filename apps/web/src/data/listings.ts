import type { ListingInput } from "@leadlah/core";
import { listingSchema } from "@leadlah/core";

import { db } from "@/lib/db";
import { listingFormSchema, type ListingFormValues } from "@/lib/listings/form";

const listingColumns =
  '"id", "propertyName", "type", price, size, bedrooms, bathrooms, location, status, photos, videos, documents, "externalLinks", "createdAt", "updatedAt"';

type ListingRow = {
  id: string;
  propertyName: string;
  type: string;
  price: string | number;
  size: string | number;
  bedrooms: string | number;
  bathrooms: string | number;
  location: string;
  status: string;
  photos: string | null;
  videos: string | null;
  documents: string | null;
  externalLinks: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

const parseJson = <T>(value: unknown, fallback: T): T => {
  if (value == null) {
    return fallback;
  }
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
};

const toListing = (row: ListingRow): ListingInput => {
  return listingSchema.parse({
    id: row.id,
    propertyName: row.propertyName,
    type: row.type,
    price: Number(row.price),
    size: Number(row.size),
    bedrooms: Number(row.bedrooms),
    bathrooms: Number(row.bathrooms),
    location: row.location,
    status: row.status,
    photos: parseJson(row.photos, []),
    videos: parseJson(row.videos, []),
    documents: parseJson(row.documents, []),
    externalLinks: parseJson(row.externalLinks, []),
    createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updatedAt)
  });
};

export async function fetchListings(): Promise<ListingInput[]> {
  const result = await db.query<ListingRow>(`SELECT ${listingColumns} FROM "listings" ORDER BY "createdAt" DESC`);
  return result.rows.map(toListing);
}

export async function insertListing(values: ListingFormValues): Promise<ListingInput> {
  const payload = listingFormSchema.parse(values);

  const result = await db.query<ListingRow>(
    `
      INSERT INTO "listings"
        ("propertyName", "type", price, size, bedrooms, bathrooms, location, status, photos, videos, documents, "externalLinks")
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING ${listingColumns}
    `,
    [
      payload.propertyName,
      payload.type,
      payload.price,
      payload.size,
      payload.bedrooms,
      payload.bathrooms,
      payload.location,
      payload.status,
      JSON.stringify(payload.photos ?? []),
      JSON.stringify(payload.videos ?? []),
      JSON.stringify(payload.documents ?? []),
      JSON.stringify(payload.externalLinks ?? [])
    ]
  );

  return toListing(result.rows[0]);
}

export async function updateListingStatus(id: string, status: ListingInput["status"]): Promise<ListingInput | null> {
  const result = await db.query<ListingRow>(
    `
      UPDATE "listings"
      SET status = $2, "updatedAt" = NOW()
      WHERE id = $1
      RETURNING ${listingColumns}
    `,
    [id, status]
  );

  const row = result.rows[0];
  return row ? toListing(row) : null;
}

export async function updateListing(id: string, values: ListingFormValues): Promise<ListingInput | null> {
  const payload = listingFormSchema.parse(values);
  const result = await db.query<ListingRow>(
    `
      UPDATE "listings"
      SET
        "propertyName" = $2,
        "type" = $3,
        price = $4,
        size = $5,
        bedrooms = $6,
        bathrooms = $7,
        location = $8,
        status = $9,
        photos = $10,
        videos = $11,
        documents = $12,
        "externalLinks" = $13,
        "updatedAt" = NOW()
      WHERE id = $1
      RETURNING ${listingColumns}
    `,
    [
      id,
      payload.propertyName,
      payload.type,
      payload.price,
      payload.size,
      payload.bedrooms,
      payload.bathrooms,
      payload.location,
      payload.status,
      JSON.stringify(payload.photos ?? []),
      JSON.stringify(payload.videos ?? []),
      JSON.stringify(payload.documents ?? []),
      JSON.stringify(payload.externalLinks ?? [])
    ]
  );

  const row = result.rows[0];
  return row ? toListing(row) : null;
}

export async function removeListing(id: string): Promise<{ id: string } | null> {
  const result = await db.query<{ id: string }>(`DELETE FROM "listings" WHERE id = $1 RETURNING id`, [id]);
  const row = result.rows[0];
  return row ?? null;
}
