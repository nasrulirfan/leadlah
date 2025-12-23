import type { ListingInput } from "@leadlah/core";
import { listingSchema } from "@leadlah/core";
import type { ListingFormPayload } from "@/lib/listings/form";
import { isApiNotFound, requestApi } from "@/lib/api";

const toListing = (row: unknown): ListingInput => listingSchema.parse(row);

export async function fetchListings(): Promise<ListingInput[]> {
  const items = await requestApi<unknown[]>("/listings");
  return items.map(toListing);
}

export async function fetchListingStatusCounts(): Promise<Record<string, number>> {
  return requestApi<Record<string, number>>("/listings/status-counts");
}

export async function insertListing(payload: ListingFormPayload): Promise<ListingInput> {
  const created = await requestApi<unknown>("/listings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return toListing(created);
}

export async function updateListingStatus(id: string, status: ListingInput["status"]): Promise<ListingInput | null> {
  try {
    const updated = await requestApi<unknown>(`/listings/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    return toListing(updated);
  } catch (error) {
    if (isApiNotFound(error)) {
      return null;
    }
    throw error;
  }
}

export async function updateListingCategory(
  id: string,
  category: ListingInput["category"]
): Promise<ListingInput | null> {
  try {
    const updated = await requestApi<unknown>(`/listings/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ category }),
    });
    return toListing(updated);
  } catch (error) {
    if (isApiNotFound(error)) {
      return null;
    }
    throw error;
  }
}

export async function updateListing(id: string, payload: ListingFormPayload): Promise<ListingInput | null> {
  try {
    const updated = await requestApi<unknown>(`/listings/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return toListing(updated);
  } catch (error) {
    if (isApiNotFound(error)) {
      return null;
    }
    throw error;
  }
}

export async function removeListing(id: string): Promise<{ id: string } | null> {
  try {
    const result = await requestApi<{ id: string }>(`/listings/${id}`, {
      method: "DELETE",
    });
    return result ?? null;
  } catch (error) {
    if (isApiNotFound(error)) {
      return null;
    }
    throw error;
  }
}

export async function fetchListingById(id: string): Promise<ListingInput | null> {
  if (!id) {
    return null;
  }
  try {
    const listing = await requestApi<unknown>(`/listings/${id}`);
    return toListing(listing);
  } catch (error) {
    if (isApiNotFound(error)) {
      return null;
    }
    throw error;
  }
}
