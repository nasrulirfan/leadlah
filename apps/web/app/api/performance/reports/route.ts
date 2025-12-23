import { NextRequest, NextResponse } from "next/server";
import { requestApi } from "@/lib/api";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type ApiError = Error & { status?: number };

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const parsedYear = yearParam ? Number(yearParam) : NaN;
    const year = Number.isFinite(parsedYear) ? parsedYear : new Date().getFullYear();

    const reports = await requestApi<any>(`/performance/${userId}/reports?year=${year}`);
    return NextResponse.json(reports);
  } catch (error) {
    console.error("Error fetching performance reports:", error);
    const status = (error as ApiError)?.status;
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch performance reports",
      },
      { status: status === 404 ? 404 : 500 },
    );
  }
}
