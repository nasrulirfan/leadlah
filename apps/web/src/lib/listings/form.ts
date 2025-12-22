import { listingSchema } from "@leadlah/core";
import { z } from "zod";

export const listingFormSchema = listingSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type ListingFormValues = z.input<typeof listingFormSchema>;
