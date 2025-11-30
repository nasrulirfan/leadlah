"use server";

import type { ListingInput } from "@leadlah/core";
import { listingSchema } from "@leadlah/core";
import { revalidatePath } from "next/cache";

import { insertListing, removeListing, updateListingStatus } from "@/data/listings";
import { listingFormSchema, type ListingFormValues } from "@/lib/listings/form";

const LISTINGS_PATH = "/listings";

export async function createListingAction(values: ListingFormValues) {
  const payload = listingFormSchema.parse(values);
  const listing = await insertListing(payload);
  revalidatePath(LISTINGS_PATH);
  return listing;
}

export async function updateListingStatusAction(params: { id: string; status: ListingInput["status"] }) {
  const id = listingSchema.shape.id.parse(params.id);
  const status = listingSchema.shape.status.parse(params.status);
  const listing = await updateListingStatus(id, status);
  revalidatePath(LISTINGS_PATH);
  return listing;
}

export async function deleteListingAction(id: string) {
  const parsedId = listingSchema.shape.id.parse(id);
  const result = await removeListing(parsedId);
  revalidatePath(LISTINGS_PATH);
  return result;
}
