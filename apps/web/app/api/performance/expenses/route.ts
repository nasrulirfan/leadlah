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

    const expenses = await requestApi<any[]>(
      `/performance/${userId}/expenses${suffix}`,
    );

    return NextResponse.json(expenses.map(toApiExpense));
  } catch (error) {
    console.error("Error fetching expenses:", error);
    const status = (error as ApiError)?.status;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch expenses" },
      { status: status === 404 ? 404 : 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const userId = session.user.id;
    const body = await request.json();

    const created = await requestApi<any>(`/performance/${userId}/expenses`, {
      method: "POST",
      body: JSON.stringify({
        category: body.category,
        amount: body.amount,
        description: body.description,
        date: body.date,
        receiptUrl: body.receiptUrl,
      }),
    });

    return NextResponse.json(toApiExpense(created));
  } catch (error) {
    console.error("Error creating expense:", error);
    const status = (error as ApiError)?.status;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create expense" },
      { status: status === 404 ? 404 : 500 },
    );
  }
}
