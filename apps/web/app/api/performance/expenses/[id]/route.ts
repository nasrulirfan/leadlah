import { NextRequest, NextResponse } from "next/server";
import { requestApi } from "@/lib/api";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type ApiExpense = {
  id: string;
  userId: string;
  category: string;
  amount: number;
  description: string;
  date: string | null;
  receiptUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type ApiError = Error & { status?: number };

const toApiExpense = (payload: any): ApiExpense => ({
  id: String(payload.id),
  userId: String(payload.userId),
  category: String(payload.category),
  amount: Number(payload.amount ?? 0),
  description: String(payload.description ?? ""),
  date: payload.date ? String(payload.date) : null,
  receiptUrl: payload.receiptUrl ? String(payload.receiptUrl) : null,
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

    const updated = await requestApi<any>(`/performance/${userId}/expenses/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        category: body.category,
        amount: body.amount,
        description: body.description,
        date: body.date,
        receiptUrl: body.receiptUrl,
      }),
    });

    return NextResponse.json(toApiExpense(updated));
  } catch (error) {
    console.error("Error updating expense:", error);
    const status = (error as ApiError)?.status;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update expense" },
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

    await requestApi(`/performance/${userId}/expenses/${id}`, {
      method: "DELETE",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting expense:", error);
    const status = (error as ApiError)?.status;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete expense" },
      { status: status === 404 ? 404 : 500 },
    );
  }
}
