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

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const targets = await requestApi<any[]>(`/performance/${userId}/targets`);
    return NextResponse.json(targets.map(toApiTarget));
  } catch (error) {
    console.error("Error fetching targets:", error);
    const status = (error as ApiError)?.status;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch targets" },
      { status: status === 404 ? 404 : 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const userId = session.user.id;
    const body = await request.json();

    const created = await requestApi<any>(`/performance/${userId}/targets`, {
      method: "POST",
      body: JSON.stringify({
        year: body.year,
        month: body.month,
        targetUnits: body.targetUnits,
        targetIncome: body.targetIncome,
      }),
    });

    return NextResponse.json(toApiTarget(created));
  } catch (error) {
    console.error("Error creating target:", error);
    const status = (error as ApiError)?.status;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create target" },
      { status: status === 404 ? 404 : 500 },
    );
  }
}
