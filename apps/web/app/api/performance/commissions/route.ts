import { NextRequest, NextResponse } from "next/server";
import { requestApi } from "@/lib/api";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type ApiCommission = {
  id: string;
  userId: string;
  listingId: string | null;
  amount: number;
  closedDate: string | null;
  notes: string | null;
  createdAt: string | null;
};

type ApiError = Error & { status?: number };

const toApiCommission = (payload: any): ApiCommission => ({
  id: String(payload.id),
  userId: String(payload.userId),
  listingId: payload.listingId ? String(payload.listingId) : null,
  amount: Number(payload.amount ?? 0),
  closedDate: payload.closedDate ? String(payload.closedDate) : null,
  notes: payload.notes ? String(payload.notes) : null,
  createdAt: payload.createdAt ? String(payload.createdAt) : null,
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    const query = new URLSearchParams();
    if (year) query.set("year", year);
    if (month) query.set("month", month);
    const suffix = query.size ? `?${query.toString()}` : "";

    const commissions = await requestApi<any[]>(
      `/performance/${userId}/commissions${suffix}`,
    );

    return NextResponse.json(commissions.map(toApiCommission));
  } catch (error) {
    console.error("Error fetching commissions:", error);
    const status = (error as ApiError)?.status;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch commissions" },
      { status: status === 404 ? 404 : 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const userId = session.user.id;
    const body = await request.json();

    const created = await requestApi<any>(`/performance/${userId}/commissions`, {
      method: "POST",
      body: JSON.stringify({
        listingId: body.listingId ?? null,
        amount: body.amount,
        closedDate: body.closedDate,
        notes: body.notes ?? null,
      }),
    });

    return NextResponse.json(toApiCommission(created));
  } catch (error) {
    console.error("Error creating commission:", error);
    const status = (error as ApiError)?.status;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create commission" },
      { status: status === 404 ? 404 : 500 },
    );
  }
}

