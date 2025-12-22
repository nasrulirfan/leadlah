import { db } from "@/lib/db";
import type { PerformanceMetrics } from "@leadlah/core";
import type {
  DashboardActivity,
  DashboardActivityType,
} from "@/lib/dashboard/types";

type NumericRecord = Record<string, string | number | null>;

const toNumber = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) {
    return 0;
  }

  return typeof value === "number" ? value : Number(value);
};

const safeDbError = (error: unknown) => {
  const message = error instanceof Error ? error.message : "";
  return message.includes("does not exist") || message.includes("relation");
};

const buildEmptyMetrics = (
  year: number,
  month?: number,
): PerformanceMetrics => ({
  period: typeof month === "number" ? { year, month } : { year },
  target: { units: 0, income: 0 },
  actual: {
    units: 0,
    commission: 0,
    expenses: 0,
    netIncome: 0,
  },
  progress: {
    unitsPercent: 0,
    incomePercent: 0,
  },
});

export async function fetchPerformanceReports(userId: string, year: number) {
  try {
    const [targetResult, commissionResult, expenseResult] = await Promise.all([
      db.query(
        `SELECT month, target_units, target_income
         FROM targets
         WHERE user_id = $1 AND year = $2`,
        [userId, year],
      ),
      db.query(
        `SELECT
           EXTRACT(MONTH FROM closed_date) AS month,
           COUNT(*) AS units,
           COALESCE(SUM(amount), 0) AS total
         FROM commissions
         WHERE user_id = $1 AND EXTRACT(YEAR FROM closed_date) = $2
         GROUP BY month`,
        [userId, year],
      ),
      db.query(
        `SELECT
           EXTRACT(MONTH FROM date) AS month,
           COALESCE(SUM(amount), 0) AS total
         FROM expenses
         WHERE user_id = $1 AND EXTRACT(YEAR FROM date) = $2
         GROUP BY month`,
        [userId, year],
      ),
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
          income: monthlyTargetSum.income + income,
        };
      }
    }

    const monthlyCommissions = new Map<
      number,
      { units: number; total: number }
    >();
    for (const row of commissionResult.rows as NumericRecord[]) {
      const month = toNumber(row.month);
      monthlyCommissions.set(month, {
        units: toNumber(row.units),
        total: toNumber(row.total),
      });
    }

    const monthlyExpenses = new Map<number, number>();
    for (const row of expenseResult.rows as NumericRecord[]) {
      const month = toNumber(row.month);
      monthlyExpenses.set(month, toNumber(row.total));
    }

    const monthlyReports: PerformanceMetrics[] = Array.from(
      { length: 12 },
      (_, index) => {
        const month = index + 1;
        const target = monthlyTargets.get(month) ?? { units: 0, income: 0 };
        const commission = monthlyCommissions.get(month) ?? {
          units: 0,
          total: 0,
        };
        const expenses = monthlyExpenses.get(month) ?? 0;
        const netIncome = commission.total - expenses;

        return {
          period: { year, month },
          target,
          actual: {
            units: commission.units,
            commission: commission.total,
            expenses,
            netIncome,
          },
          progress: {
            unitsPercent:
              target.units > 0 ? (commission.units / target.units) * 100 : 0,
            incomePercent:
              target.income > 0 ? (netIncome / target.income) * 100 : 0,
          },
        };
      },
    );

    const yearlyActual = monthlyReports.reduce(
      (acc, report) => ({
        units: acc.units + report.actual.units,
        commission: acc.commission + report.actual.commission,
        expenses: acc.expenses + report.actual.expenses,
        netIncome: acc.netIncome + report.actual.netIncome,
      }),
      { units: 0, commission: 0, expenses: 0, netIncome: 0 },
    );

    const yearlyTarget = annualTarget ?? monthlyTargetSum;
    const yearlyReport: PerformanceMetrics = {
      period: { year },
      target: yearlyTarget,
      actual: yearlyActual,
      progress: {
        unitsPercent:
          yearlyTarget.units > 0
            ? (yearlyActual.units / yearlyTarget.units) * 100
            : 0,
        incomePercent:
          yearlyTarget.income > 0
            ? (yearlyActual.netIncome / yearlyTarget.income) * 100
            : 0,
      },
    };

    return { yearlyReport, monthlyReports };
  } catch (error) {
    if (safeDbError(error)) {
      return {
        yearlyReport: buildEmptyMetrics(year),
        monthlyReports: Array.from({ length: 12 }, (_, index) =>
          buildEmptyMetrics(year, index + 1),
        ),
      };
    }
    throw error;
  }
}

export async function fetchDashboardPerformance(userId: string) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const { monthlyReports } = await fetchPerformanceReports(userId, year);
  const currentMonth =
    monthlyReports.find((report) => report.period.month === month) ??
    buildEmptyMetrics(year, month);

  const performanceData = {
    target: currentMonth.target.income,
    commission: currentMonth.actual.commission,
    expenses: currentMonth.actual.expenses,
    netIncome: currentMonth.actual.netIncome,
    unitsTarget: currentMonth.target.units,
    unitsClosed: currentMonth.actual.units,
  };

  const monthLabels = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthlyData = monthLabels.slice(0, month).map((label, index) => {
    const report = monthlyReports[index] ?? buildEmptyMetrics(year, index + 1);
    return {
      month: label,
      commission: report.actual.commission,
      expenses: report.actual.expenses,
      target: report.target.income,
    };
  });

  return { performanceData, monthlyData };
}

const formatRelativeTime = (date: Date, now: Date) => {
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 10) {
    return "just now";
  }
  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return "Yesterday";
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return date.toLocaleDateString();
};

const titleCase = (value: string) =>
  value
    .toLowerCase()
    .split(/[_\s]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

type ActivityRow = {
  id: string;
  type: DashboardActivityType;
  title: string;
  description: string;
  occurredAt: Date | string;
};

const toActivity = (row: ActivityRow, now: Date): DashboardActivity => {
  const occurredAt =
    row.occurredAt instanceof Date ? row.occurredAt : new Date(row.occurredAt);
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    time: formatRelativeTime(occurredAt, now),
  };
};

export async function fetchDashboardActivities(
  userId: string,
): Promise<DashboardActivity[]> {
  const now = new Date();

  try {
    const [
      listingResult,
      processResult,
      reminderResult,
      targetResult,
      commissionResult,
      expenseResult,
    ] = await Promise.all([
      db.query<{ id: string; propertyName: string; createdAt: Date | string }>(
        `SELECT id, "propertyName" AS "propertyName", "createdAt" AS "createdAt"
           FROM "listings"
           ORDER BY "createdAt" DESC
           LIMIT 6`,
      ),
      db.query<{
        id: string;
        stage: string;
        completedAt: Date | string;
        propertyName: string;
      }>(
        `
          SELECT pl.id, pl.stage, pl."completedAt" AS "completedAt", l."propertyName" AS "propertyName"
          FROM "process_logs" pl
          JOIN "listings" l ON l.id = pl."listingId"
          WHERE pl."completedAt" IS NOT NULL
          ORDER BY pl."completedAt" DESC
          LIMIT 6
        `,
      ),
      db.query<{
        id: string;
        message: string;
        status: string;
        updatedAt: Date | string;
        propertyName: string | null;
      }>(
        `
          SELECT r.id,
                 r.message,
                 r.status,
                 r."updatedAt" AS "updatedAt",
                 l."propertyName" AS "propertyName"
          FROM "reminders" r
          LEFT JOIN "listings" l ON l.id = r."listingId"
          WHERE r."userId" = $1
          ORDER BY r."updatedAt" DESC
          LIMIT 6
        `,
        [userId],
      ),
      db.query<{
        id: string;
        year: number;
        month: number | null;
        target_units: number | string;
        target_income: number | string;
        created_at: Date | string;
      }>(
        `
          SELECT id, year, month, target_units, target_income, created_at
          FROM targets
          WHERE user_id = $1
          ORDER BY created_at DESC
          LIMIT 4
        `,
        [userId],
      ),
      db.query<{
        id: string;
        amount: number | string;
        closed_date: Date | string;
        propertyName: string | null;
      }>(
        `
          SELECT c.id,
                 c.amount,
                 c.closed_date,
                 l."propertyName" AS "propertyName"
          FROM commissions c
          LEFT JOIN "listings" l ON l.id = c.listing_id
          WHERE c.user_id = $1
          ORDER BY c.closed_date DESC, c.created_at DESC
          LIMIT 4
        `,
        [userId],
      ),
      db.query<{
        id: string;
        category: string;
        amount: number | string;
        description: string;
        date: Date | string;
        created_at: Date | string;
      }>(
        `
          SELECT id, category, amount, description, date, created_at
          FROM expenses
          WHERE user_id = $1
          ORDER BY created_at DESC
          LIMIT 4
        `,
        [userId],
      ),
    ]);

    const rows: ActivityRow[] = [
      ...listingResult.rows.map((row) => ({
        id: row.id,
        type: "listing" as const,
        title: "New listing added",
        description: row.propertyName,
        occurredAt: row.createdAt,
      })),
      ...processResult.rows.map((row) => ({
        id: row.id,
        type: "listing" as const,
        title: `${titleCase(row.stage)} completed`,
        description: row.propertyName,
        occurredAt: row.completedAt,
      })),
      ...reminderResult.rows.map((row) => {
        const status = (row.status ?? "").toUpperCase();
        const title =
          status === "DONE"
            ? "Reminder completed"
            : status === "DISMISSED"
              ? "Reminder dismissed"
              : "Reminder scheduled";
        const description = row.propertyName
          ? `${row.propertyName} • ${row.message}`
          : row.message;
        return {
          id: row.id,
          type: "reminder" as const,
          title,
          description,
          occurredAt: row.updatedAt,
        };
      }),
      ...targetResult.rows.map((row) => {
        const monthLabel =
          row.month == null
            ? `Year ${row.year}`
            : `${new Date(row.year, row.month - 1).toLocaleString("default", { month: "short" })} ${row.year}`;
        return {
          id: row.id,
          type: "target" as const,
          title: "Target set",
          description: `${monthLabel} • ${toNumber(row.target_units)} units • RM ${toNumber(row.target_income).toLocaleString()}`,
          occurredAt: row.created_at,
        };
      }),
      ...commissionResult.rows.map((row) => ({
        id: row.id,
        type: "sale" as const,
        title: "Commission recorded",
        description: row.propertyName
          ? `${row.propertyName} • RM ${toNumber(row.amount).toLocaleString()}`
          : `RM ${toNumber(row.amount).toLocaleString()}`,
        occurredAt: row.closed_date,
      })),
      ...expenseResult.rows.map((row) => ({
        id: row.id,
        type: "expense" as const,
        title: "Expense logged",
        description: `${row.category} • RM ${toNumber(row.amount).toLocaleString()} • ${row.description}`,
        occurredAt: row.created_at,
      })),
    ];

    return rows
      .map((row) => toActivity(row, now))
      .sort((a, b) => {
        const aTime = rows.find((item) => item.id === a.id)?.occurredAt;
        const bTime = rows.find((item) => item.id === b.id)?.occurredAt;
        const aDate =
          aTime instanceof Date ? aTime : aTime ? new Date(aTime) : new Date(0);
        const bDate =
          bTime instanceof Date ? bTime : bTime ? new Date(bTime) : new Date(0);
        return bDate.getTime() - aDate.getTime();
      })
      .slice(0, 8);
  } catch (error) {
    if (safeDbError(error)) {
      return [];
    }
    throw error;
  }
}
