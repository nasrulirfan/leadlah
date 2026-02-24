import { NextRequest, NextResponse } from "next/server";
import { requestApi } from "@/lib/api";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : null;

    const reports = await requestApi<any>(
      `/performance/${userId}/metrics?year=${year}`,
    );
    const monthlyReports = Array.isArray(reports?.monthlyReports)
      ? reports.monthlyReports
      : [];
    const yearlyReport = reports?.yearlyReport;

    const emptyMetrics = {
      period: month ? { year, month } : { year, month: null },
      target: { units: 0, commission: 0 },
      actual: { units: 0, commission: 0, expenses: 0, netIncome: 0 },
      progress: { unitsPercent: 0, commissionPercent: 0 },
    };

    const resolved =
      typeof month === "number"
        ? monthlyReports.find((report: any) => report?.period?.month === month)
        : yearlyReport;

    return NextResponse.json(resolved ?? emptyMetrics);
  } catch (error) {
    console.error("Error fetching metrics:", error);
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 });
  }
}
