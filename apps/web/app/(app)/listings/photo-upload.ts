"use client";

import { createListingPhotoUploadUrlsAction } from "./actions";

type UploadMode = "auto" | "direct" | "proxy";

const uploadMode = (() => {
  const raw = process.env.NEXT_PUBLIC_R2_UPLOAD_MODE?.toLowerCase().trim();
  if (raw === "direct" || raw === "proxy" || raw === "auto") {
    return raw;
  }
  return "auto" as const;
})();

const uploadDirect = async (params: { listingId: string; files: File[] }) => {
  const meta = params.files.map((file) => ({
    filename: file.name,
    contentType: file.type,
    bytes: file.size,
  }));

  const { uploads } = await createListingPhotoUploadUrlsAction({
    listingId: params.listingId,
    files: meta,
  });

  if (uploads.length !== params.files.length) {
    throw new Error("Upload URL count mismatch.");
  }

  for (let i = 0; i < uploads.length; i += 1) {
    const upload = uploads[i]!;
    const file = params.files[i]!;
    const put = await fetch(upload.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!put.ok) {
      throw new Error(`Upload failed (${put.status}).`);
    }
  }

  return uploads.map((u) => u.key);
};

const uploadProxy = async (params: { listingId: string; files: File[] }) => {
  const form = new FormData();
  params.files.forEach((file) => form.append("files", file, file.name));
  const response = await fetch(`/api/listings/${params.listingId}/photos/stage`, {
    method: "POST",
    body: form,
  });

  const text = await response.text();
  const body = text
    ? (() => {
        try {
          return JSON.parse(text);
        } catch {
          return { message: text };
        }
      })()
    : null;

  if (!response.ok) {
    const message =
      body && typeof body === "object" && "message" in body
        ? String((body as any).message ?? "Upload failed.")
        : `Upload failed (${response.status}).`;
    throw new Error(message);
  }

  const stagedKeys = (body as any)?.stagedKeys as string[] | undefined;
  if (!Array.isArray(stagedKeys) || stagedKeys.length !== params.files.length) {
    throw new Error("Proxy upload did not return staged keys.");
  }

  return stagedKeys;
};

export async function stageListingPhotos(params: { listingId: string; files: File[] }) {
  if (uploadMode === "proxy") {
    return uploadProxy(params);
  }

  if (uploadMode === "direct") {
    return uploadDirect(params);
  }

  try {
    return await uploadDirect(params);
  } catch (error) {
    return uploadProxy(params);
  }
}

