import { listingSchema } from "@leadlah/core";
import { z } from "zod";

export const listingFormSchema = listingSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

type ListingFormSchemaInput = z.input<typeof listingFormSchema>;
export type ListingFormPayload = z.output<typeof listingFormSchema>;
type ListingExternalLinkInput = NonNullable<
  ListingFormSchemaInput["externalLinks"]
>[number];

type ListingExternalLinkFormValue = Omit<ListingExternalLinkInput, "expiresAt"> & {
  expiresAt?: string;
};

export type ListingFormValues = Omit<
  ListingFormSchemaInput,
  "expiresAt" | "lastEnquiryAt" | "externalLinks"
> & {
  expiresAt?: string;
  lastEnquiryAt?: string;
  externalLinks: ListingExternalLinkFormValue[];
};
