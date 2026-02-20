import { requireSession } from "@/lib/session";
import { NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function GET(
  _request: Request,
  { params }: { params: { id: string; photoId: string } },
) {
  await requireSession();

  const response = await fetch(
    `${API_BASE_URL}/listings/${params.id}/photos/${params.photoId}/download-url`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json(
      { message: text || "Unable to download photo." },
      { status: response.status },
    );
  }

  const data = (await response.json()) as { url?: string };
  if (!data.url) {
    return NextResponse.json({ message: "Missing download URL." }, { status: 500 });
  }

  return NextResponse.redirect(data.url);
}

