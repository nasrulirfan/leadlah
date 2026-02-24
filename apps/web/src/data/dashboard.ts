import type { PerformanceMetrics, UserProfile } from "@leadlah/core";
import type { DashboardReminders, StoredReminder } from "@/lib/reminders/types";
import type { DashboardActivity } from "@/lib/dashboard/types";
import { getFallbackProfile } from "@/data/profile";
import { isApiNotFound, requestApi } from "@/lib/api";

type PerformanceReportsResponse = {
  yearlyReport: PerformanceMetrics;
  monthlyReports: PerformanceMetrics[];
};

const parseDate = (value: unknown) => {
  if (!value) {
    return undefined;
  }
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

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

export async function fetchDashboardProfile(
  userId: string,
): Promise<UserProfile> {
  try {
    const profile = await requestApi<UserProfile>(`/profiles/${userId}`);
    return profile;
  } catch (error) {
    if (isApiNotFound(error)) {
      const fallback = getFallbackProfile();
      return { ...fallback, id: userId };
    }
    throw error;
  }
}

export async function fetchListingStatusCounts(): Promise<
  Record<string, number>
> {
  return requestApi<Record<string, number>>(`/listings/status-counts`);
}

export async function fetchDashboardPerformance(userId: string) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const response = await requestApi<PerformanceReportsResponse>(
    `/performance/${userId}/metrics?year=${year}`,
  );

  const monthlyReports = response.monthlyReports ?? [];
  const currentMonth =
    monthlyReports.find((report) => report.period.month === month) ??
    ({
      period: { year, month },
      target: { units: 0, commission: 0 },
      actual: { units: 0, commission: 0, expenses: 0, netIncome: 0 },
      progress: { unitsPercent: 0, commissionPercent: 0 },
    } satisfies PerformanceMetrics);

  const performanceData = {
    target: currentMonth.target.commission,
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
    const report = monthlyReports[index] as PerformanceMetrics | undefined;
    return {
      month: label,
      commission: report?.actual.commission ?? 0,
      expenses: report?.actual.expenses ?? 0,
      target: report?.target.commission ?? 0,
    };
  });

  return { performanceData, monthlyData };
}

type ApiActivity = {
  id: string;
  type: DashboardActivity["type"];
  title: string;
  description: string;
  occurredAt: string;
};

export async function fetchDashboardActivities(
  userId: string,
): Promise<DashboardActivity[]> {
  const now = new Date();
  const items = await requestApi<ApiActivity[]>(
    `/dashboard/${userId}/activities?limit=8`,
  );
  return (items ?? []).map((activity) => {
    const occurredAt = parseDate(activity.occurredAt) ?? now;
    return {
      id: activity.id,
      type: activity.type,
      title: activity.title,
      description: activity.description,
      time: formatRelativeTime(occurredAt, now),
    };
  });
}

type ApiStoredReminder = Omit<
  StoredReminder,
  "dueAt" | "completedAt" | "dismissedAt" | "createdAt" | "updatedAt"
> & {
  dueAt: string;
  completedAt?: string | null;
  dismissedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

type ApiDashboardReminders = {
  today: ApiStoredReminder[];
  tomorrow: ApiStoredReminder[];
  thisWeek: ApiStoredReminder[];
};

const toStoredReminder = (reminder: ApiStoredReminder): StoredReminder => ({
  ...reminder,
  dueAt: parseDate(reminder.dueAt) ?? new Date(),
  completedAt: parseDate(reminder.completedAt),
  dismissedAt: parseDate(reminder.dismissedAt),
  createdAt: parseDate(reminder.createdAt) ?? new Date(),
  updatedAt: parseDate(reminder.updatedAt) ?? new Date(),
});

export async function fetchDashboardReminders(
  userId: string,
  timeZone: string,
): Promise<DashboardReminders> {
  const data = await requestApi<ApiDashboardReminders>(
    `/reminders/${userId}/dashboard?timeZone=${encodeURIComponent(timeZone)}`,
  );

  return {
    today: (data.today ?? []).map(toStoredReminder),
    tomorrow: (data.tomorrow ?? []).map(toStoredReminder),
    thisWeek: (data.thisWeek ?? []).map(toStoredReminder),
  };
}
