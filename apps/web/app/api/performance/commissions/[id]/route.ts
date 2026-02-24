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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();
    const userId = session.user.id;
    const body = await request.json();
    const { id } = params;

    const updated = await requestApi<any>(
      `/performance/${userId}/commissions/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          listingId: body.listingId ?? null,
          amount: body.amount,
          closedDate: body.closedDate,
          notes: body.notes ?? null,
        }),
      },
    );

    return NextResponse.json(toApiCommission(updated));
  } catch (error) {
    console.error("Error updating commission:", error);
    const status = (error as ApiError)?.status;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update commission" },
      { status: status === 404 ? 404 : 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();
    const userId = session.user.id;
    const { id } = params;

    await requestApi(`/performance/${userId}/commissions/${id}`, {
      method: "DELETE",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting commission:", error);
    const status = (error as ApiError)?.status;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete commission" },
      { status: status === 404 ? 404 : 500 },
    );
  }
}

