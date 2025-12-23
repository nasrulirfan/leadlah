import { NextRequest, NextResponse } from "next/server";
import { requestApi } from "@/lib/api";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type ApiTarget = {
  id: string;
  userId: string;
  year: number;
  month: number | null;
  targetUnits: number;
  targetIncome: number;
  createdAt: string | null;
  updatedAt: string | null;
};

type ApiError = Error & { status?: number };

const toApiTarget = (payload: any): ApiTarget => ({
  id: String(payload.id),
  userId: String(payload.userId),
  year: Number(payload.year ?? 0),
  month: typeof payload.month === "number" ? payload.month : null,
  targetUnits: Number(payload.targetUnits ?? 0),
  targetIncome: Number(payload.targetIncome ?? 0),
  createdAt: payload.createdAt ? String(payload.createdAt) : null,
  updatedAt: payload.updatedAt ? String(payload.updatedAt) : null,
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

    const updated = await requestApi<any>(`/performance/${userId}/targets/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        targetUnits: body.targetUnits,
        targetIncome: body.targetIncome,
      }),
    });

    return NextResponse.json(toApiTarget(updated));
  } catch (error) {
    console.error("Error updating target:", error);
    const status = (error as ApiError)?.status;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update target" },
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

    await requestApi(`/performance/${userId}/targets/${id}`, {
      method: "DELETE",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting target:", error);
    const status = (error as ApiError)?.status;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete target" },
      { status: status === 404 ? 404 : 500 },
    );
  }
}
