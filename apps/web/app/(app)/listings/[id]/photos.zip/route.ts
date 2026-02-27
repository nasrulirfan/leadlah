import { requireSession } from "@/lib/session";
import { NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireSession();

  const { id } = await params;
  const response = await fetch(`${API_BASE_URL}/listings/${id}/photos/download-zip`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json(
      { message: text || "Unable to download photos." },
      { status: response.status },
    );
  }

  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store");

  return new NextResponse(response.body, {
    status: response.status,
    headers,
  });
}
