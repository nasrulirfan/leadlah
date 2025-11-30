import type { ListingInput } from "@leadlah/core";
import { listingSchema } from "@leadlah/core";

export const listingFormSchema = listingSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type ListingFormValues = Omit<ListingInput, "id" | "createdAt" | "updatedAt">;
