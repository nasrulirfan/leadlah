import type { ListingInput } from "@leadlah/core";
import { listingSchema } from "@leadlah/core";

import { db } from "@/lib/db";
import { listingFormSchema, type ListingFormValues } from "@/lib/listings/form";

const listingColumns =
  '"id", "propertyName", "type", category, price, size, bedrooms, bathrooms, location, "buildingProject", status, "expiresAt", "lastEnquiryAt", photos, videos, documents, "externalLinks", "createdAt", "updatedAt"';

type ListingRow = {
  id: string;
  propertyName: string;
  type: string;
  category: string;
  price: string | number;
  size: string | number;
  bedrooms: string | number;
  bathrooms: string | number;
  location: string;
  buildingProject: string | null;
  status: string;
  expiresAt: Date | string | null;
  lastEnquiryAt: Date | string | null;
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
    category: row.category,
    price: Number(row.price),
    size: Number(row.size),
    bedrooms: Number(row.bedrooms),
    bathrooms: Number(row.bathrooms),
    location: row.location,
    buildingProject: row.buildingProject ?? undefined,
    status: row.status,
    expiresAt: row.expiresAt ?? undefined,
    lastEnquiryAt: row.lastEnquiryAt ?? undefined,
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

export async function fetchListingStatusCounts(): Promise<Record<string, number>> {
  const result = await db.query<{ status: string; count: string }>(
    `SELECT status, COUNT(*)::text AS count FROM "listings" GROUP BY status`
  );
  return result.rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = Number(row.count ?? 0);
    return acc;
  }, {});
}

export async function insertListing(values: ListingFormValues): Promise<ListingInput> {
  const payload = listingFormSchema.parse(values);

  const result = await db.query<ListingRow>(
    `
      INSERT INTO "listings"
        ("propertyName", "type", category, price, size, bedrooms, bathrooms, location, "buildingProject", status, "expiresAt", "lastEnquiryAt", photos, videos, documents, "externalLinks")
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING ${listingColumns}
    `,
    [
      payload.propertyName,
      payload.type,
      payload.category,
      payload.price,
      payload.size,
      payload.bedrooms,
      payload.bathrooms,
      payload.location,
      payload.buildingProject ?? null,
      payload.status,
      payload.expiresAt ?? null,
      payload.lastEnquiryAt ?? null,
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

export async function updateListingCategory(
  id: string,
  category: ListingInput["category"]
): Promise<ListingInput | null> {
  const result = await db.query<ListingRow>(
    `
      UPDATE "listings"
      SET category = $2, "updatedAt" = NOW()
      WHERE id = $1
      RETURNING ${listingColumns}
    `,
    [id, category]
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
        category = $4,
        price = $5,
        size = $6,
        bedrooms = $7,
        bathrooms = $8,
        location = $9,
        "buildingProject" = $10,
        status = $11,
        "expiresAt" = $12,
        "lastEnquiryAt" = $13,
        photos = $14,
        videos = $15,
        documents = $16,
        "externalLinks" = $17,
        "updatedAt" = NOW()
      WHERE id = $1
      RETURNING ${listingColumns}
    `,
    [
      id,
      payload.propertyName,
      payload.type,
      payload.category,
      payload.price,
      payload.size,
      payload.bedrooms,
      payload.bathrooms,
      payload.location,
      payload.buildingProject ?? null,
      payload.status,
      payload.expiresAt ?? null,
      payload.lastEnquiryAt ?? null,
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

export async function fetchListingById(id: string): Promise<ListingInput | null> {
  if (!id) {
    return null;
  }
  const result = await db.query<ListingRow>(`SELECT ${listingColumns} FROM "listings" WHERE id = $1 LIMIT 1`, [id]);
  const row = result.rows[0];
  return row ? toListing(row) : null;
}
