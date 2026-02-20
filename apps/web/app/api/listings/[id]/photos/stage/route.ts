import { requireSession } from "@/lib/session";
import { NextResponse } from "next/server";
import { listingSchema } from "@leadlah/core";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const MAX_BYTES = 12 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  await requireSession();
  const listingId = listingSchema.shape.id.parse(params.id);

  const form = await request.formData();
  const files = form.getAll("files").filter((item): item is File => item instanceof File);

  if (!files.length) {
    return NextResponse.json({ message: "No files provided." }, { status: 400 });
  }

  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { message: "Unsupported file type. Allowed: JPEG, PNG, HEIC/HEIF." },
        { status: 400 },
      );
    }
    if (file.size <= 0 || file.size > MAX_BYTES) {
      return NextResponse.json(
        { message: `Each image must be <= ${(MAX_BYTES / (1024 * 1024)).toFixed(0)} MB.` },
        { status: 400 },
      );
    }
  }

  const meta = files.map((file) => ({
    filename: file.name,
    contentType: file.type,
    bytes: file.size,
  }));

  const uploadUrlsResponse = await fetch(
    `${API_BASE_URL}/listings/${listingId}/photos/upload-urls`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files: meta }),
      cache: "no-store",
    },
  );

  if (!uploadUrlsResponse.ok) {
    const text = await uploadUrlsResponse.text();
    return NextResponse.json(
      { message: text || "Unable to create upload URLs." },
      { status: uploadUrlsResponse.status },
    );
  }

  const data = (await uploadUrlsResponse.json()) as {
    uploads: { key: string; uploadUrl: string }[];
  };

  const uploads = data.uploads ?? [];
  if (uploads.length !== files.length) {
    return NextResponse.json(
      { message: "Upload URL count mismatch." },
      { status: 500 },
    );
  }

  for (let i = 0; i < uploads.length; i += 1) {
    const upload = uploads[i]!;
    const file = files[i]!;
    const put = await fetch(upload.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: await file.arrayBuffer(),
    });
    if (!put.ok) {
      return NextResponse.json(
        { message: `Upload failed (${put.status}).` },
        { status: 502 },
      );
    }
  }

  return NextResponse.json(
    { stagedKeys: uploads.map((u) => u.key) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

