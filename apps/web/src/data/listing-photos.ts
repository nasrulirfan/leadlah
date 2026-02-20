import { requestApi } from "@/lib/api";
import { listingSchema } from "@leadlah/core";
import type { ListingInput } from "@leadlah/core";

const toListing = (row: unknown): ListingInput => listingSchema.parse(row);

export async function createListingPhotoUploadUrls(params: {
  listingId: string;
  files: { filename: string; contentType: string; bytes: number }[];
}): Promise<{ uploads: { key: string; uploadUrl: string }[] }> {
  return requestApi<{ uploads: { key: string; uploadUrl: string }[] }>(
    `/listings/${params.listingId}/photos/upload-urls`,
    {
      method: "POST",
      body: JSON.stringify({ files: params.files }),
    },
  );
}

export async function ingestListingPhotos(params: { listingId: string; stagedKeys: string[] }) {
  const listing = await requestApi<unknown>(`/listings/${params.listingId}/photos/ingest`, {
    method: "POST",
    body: JSON.stringify({ stagedKeys: params.stagedKeys }),
  });
  return toListing(listing);
}

export async function reorderListingPhotos(params: { listingId: string; photoIds: string[] }) {
  const listing = await requestApi<unknown>(`/listings/${params.listingId}/photos/order`, {
    method: "PATCH",
    body: JSON.stringify({ photoIds: params.photoIds }),
  });
  return toListing(listing);
}

export async function deleteListingPhoto(params: { listingId: string; photoId: string }) {
  const listing = await requestApi<unknown>(`/listings/${params.listingId}/photos/${params.photoId}`, {
    method: "DELETE",
  });
  return toListing(listing);
}

export async function replaceListingPhoto(params: {
  listingId: string;
  photoId: string;
  stagedKey: string;
}) {
  const listing = await requestApi<unknown>(
    `/listings/${params.listingId}/photos/${params.photoId}/replace`,
    {
      method: "POST",
      body: JSON.stringify({ stagedKey: params.stagedKey }),
    },
  );
  return toListing(listing);
}

export async function getListingPhotoDownloadUrl(params: { listingId: string; photoId: string }) {
  return requestApi<{ url: string; filename: string }>(
    `/listings/${params.listingId}/photos/${params.photoId}/download-url`,
  );
}

