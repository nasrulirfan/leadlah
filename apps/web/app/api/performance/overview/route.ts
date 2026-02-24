import { NextRequest, NextResponse } from "next/server";
import type { PerformanceMetrics } from "@leadlah/core";
import { requestApi } from "@/lib/api";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type ApiError = Error & { status?: number };

type PerformanceMetricsResponse = {
  yearlyReport: PerformanceMetrics;
  monthlyReports: PerformanceMetrics[];
};

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const parsedYear = yearParam ? Number(yearParam) : NaN;
    const resolvedYear = Number.isFinite(parsedYear) ? parsedYear : year;

    const response = await requestApi<PerformanceMetricsResponse>(
      `/performance/${userId}/metrics?year=${resolvedYear}`,
    );

    const monthlyReports = response.monthlyReports ?? [];
    const currentMonth =
      monthlyReports.find((report) => report.period.month === month) ??
      ({
        period: { year: resolvedYear, month },
        target: { units: 0, income: 0 },
        actual: { units: 0, commission: 0, expenses: 0, netIncome: 0 },
        progress: { unitsPercent: 0, incomePercent: 0 },
      } satisfies PerformanceMetrics);

    const currentYear =
      response.yearlyReport ??
      ({
        period: { year: resolvedYear },
        target: { units: 0, income: 0 },
        actual: { units: 0, commission: 0, expenses: 0, netIncome: 0 },
        progress: { unitsPercent: 0, incomePercent: 0 },
      } satisfies PerformanceMetrics);

    return NextResponse.json({ currentMonth, currentYear });
  } catch (error) {
    console.error("Error fetching performance overview:", error);
    const status = (error as ApiError)?.status;
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch performance overview",
      },
      { status: status === 404 ? 404 : 500 },
    );
  }
}

