import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

type NumericRecord = Record<string, string | number | null>;

const toNumber = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) {
    return 0;
  }

  return typeof value === "number" ? value : Number(value);
};

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const parsedYear = yearParam ? Number(yearParam) : NaN;
    const year = Number.isFinite(parsedYear) ? parsedYear : new Date().getFullYear();

    const [targetResult, commissionResult, expenseResult] = await Promise.all([
      db.query(
        `SELECT month, target_units, target_income 
         FROM targets 
         WHERE user_id = $1 AND year = $2`,
        [userId, year]
      ),
      db.query(
        `SELECT 
           EXTRACT(MONTH FROM closed_date) AS month,
           COUNT(*) AS units,
           COALESCE(SUM(amount), 0) AS total 
         FROM commissions 
         WHERE user_id = $1 AND EXTRACT(YEAR FROM closed_date) = $2
         GROUP BY month`,
        [userId, year]
      ),
      db.query(
        `SELECT 
           EXTRACT(MONTH FROM date) AS month,
           COALESCE(SUM(amount), 0) AS total 
         FROM expenses 
         WHERE user_id = $1 AND EXTRACT(YEAR FROM date) = $2
         GROUP BY month`,
        [userId, year]
      )
    ]);

    const monthlyTargets = new Map<number, { units: number; income: number }>();
    let annualTarget: { units: number; income: number } | null = null;
    let monthlyTargetSum = { units: 0, income: 0 };

    for (const row of targetResult.rows as NumericRecord[]) {
      const units = toNumber(row.target_units);
      const income = toNumber(row.target_income);
      const monthValue = row.month === null ? null : toNumber(row.month);

      if (monthValue === null) {
        annualTarget = { units, income };
      } else {
        const month = monthValue;
        monthlyTargets.set(month, { units, income });
        monthlyTargetSum = {
          units: monthlyTargetSum.units + units,
          income: monthlyTargetSum.income + income
        };
      }
    }

    const monthlyCommissions = new Map<number, { units: number; total: number }>();
    for (const row of commissionResult.rows as NumericRecord[]) {
      const month = toNumber(row.month);
      monthlyCommissions.set(month, {
        units: toNumber(row.units),
        total: toNumber(row.total)
      });
    }

    const monthlyExpenses = new Map<number, number>();
    for (const row of expenseResult.rows as NumericRecord[]) {
      const month = toNumber(row.month);
      monthlyExpenses.set(month, toNumber(row.total));
    }

    const monthlyReports = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const target = monthlyTargets.get(month) ?? { units: 0, income: 0 };
      const commission = monthlyCommissions.get(month) ?? { units: 0, total: 0 };
      const expenses = monthlyExpenses.get(month) ?? 0;
      const netIncome = commission.total - expenses;

      return {
        period: { year, month },
        target,
        actual: {
          units: commission.units,
          commission: commission.total,
          expenses,
          netIncome
        },
        progress: {
          unitsPercent: target.units > 0 ? (commission.units / target.units) * 100 : 0,
          incomePercent: target.income > 0 ? (netIncome / target.income) * 100 : 0
        }
      };
    });

    const yearlyActual = monthlyReports.reduce(
      (acc, report) => ({
        units: acc.units + report.actual.units,
        commission: acc.commission + report.actual.commission,
        expenses: acc.expenses + report.actual.expenses,
        netIncome: acc.netIncome + report.actual.netIncome
      }),
      { units: 0, commission: 0, expenses: 0, netIncome: 0 }
    );

    const yearlyTarget = annualTarget ?? monthlyTargetSum;
    const yearlyReport = {
      period: { year },
      target: yearlyTarget,
      actual: yearlyActual,
      progress: {
        unitsPercent: yearlyTarget.units > 0 ? (yearlyActual.units / yearlyTarget.units) * 100 : 0,
        incomePercent:
          yearlyTarget.income > 0 ? (yearlyActual.netIncome / yearlyTarget.income) * 100 : 0
      }
    };

    return NextResponse.json({
      yearlyReport,
      monthlyReports
    });
  } catch (error) {
    console.error("Error fetching performance reports:", error);
    return NextResponse.json({ error: "Failed to fetch performance reports" }, { status: 500 });
  }
}
