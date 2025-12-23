"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Target, Expense, PerformanceMetrics } from "@leadlah/core";
import { ExpenseCategory } from "@leadlah/core";

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

type ApiExpense = {
  id: string;
  userId: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  date: string | null;
  receiptUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type PerformanceReportsResponse = {
  yearlyReport: PerformanceMetrics;
  monthlyReports: PerformanceMetrics[];
};

const request = async <T>(url: string, init: RequestInit = {}) => {
  try {
    const response = await fetch(url, {
      cache: init.cache ?? "no-store",
      ...init
    });

    const text = await response.text();
    let payload: any = null;

    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = text;
      }
    }

    if (!response.ok) {
      const message =
        payload && typeof payload === "object" && "error" in payload
          ? (payload as { error?: string }).error
          : null;
      throw new Error(message || `Request failed with status ${response.status}`);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unable to complete request");
  }
};

const deserializeTarget = (target: ApiTarget): Target => ({
  id: target.id,
  userId: target.userId,
  year: target.year,
  month: typeof target.month === "number" ? target.month : undefined,
  targetUnits: target.targetUnits,
  targetIncome: target.targetIncome,
  createdAt: target.createdAt ? new Date(target.createdAt) : new Date(),
  updatedAt: target.updatedAt ? new Date(target.updatedAt) : new Date()
});

const deserializeExpense = (expense: ApiExpense): Expense => ({
  id: expense.id,
  userId: expense.userId,
  category: expense.category,
  amount: expense.amount,
  description: expense.description,
  date: expense.date ? new Date(expense.date) : new Date(),
  receiptUrl: expense.receiptUrl ?? undefined,
  createdAt: expense.createdAt ? new Date(expense.createdAt) : new Date(),
  updatedAt: expense.updatedAt ? new Date(expense.updatedAt) : new Date()
});

const sortTargets = (items: Target[]) => {
  const monthValue = (month?: number) => (typeof month === "number" ? month : -Infinity);

  return [...items].sort((a, b) => {
    if (a.year !== b.year) {
      return b.year - a.year;
    }

    return monthValue(b.month) - monthValue(a.month);
  });
};

const dedupeTargets = (items: Target[]) => {
  const map = new Map<string, Target>();
  for (const target of items) {
    const key = `${target.year}:${target.month ?? "annual"}`;
    const existing = map.get(key);
    if (!existing || target.updatedAt.getTime() > existing.updatedAt.getTime()) {
      map.set(key, target);
    }
  }
  return [...map.values()];
};

const sortExpenses = (items: Expense[]) =>
  [...items].sort((a, b) => b.date.getTime() - a.date.getTime());

const formatDatePayload = (date?: Date | string) => {
  if (!date) {
    return undefined;
  }

  if (typeof date === "string") {
    return date;
  }

  return date.toISOString().split("T")[0];
};

const buildEmptyMetrics = (year: number, month?: number): PerformanceMetrics => ({
  period: typeof month === "number" ? { year, month } : { year },
  target: { units: 0, income: 0 },
  actual: {
    units: 0,
    commission: 0,
    expenses: 0,
    netIncome: 0
  },
  progress: {
    unitsPercent: 0,
    incomePercent: 0
  }
});

export function usePerformanceData() {
  const [data, setData] = useState<{
    currentMonth: PerformanceMetrics;
    currentYear: PerformanceMetrics;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    try {
      const response = await request<PerformanceReportsResponse>(
        `/api/performance/reports?year=${year}`
      );
      const monthly = response.monthlyReports ?? [];
      const currentMonth =
        monthly.find((report) => report.period.month === month) ?? buildEmptyMetrics(year, month);

      setData({
        currentMonth,
        currentYear: response.yearlyReport ?? buildEmptyMetrics(year)
      });
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load performance data";
      setError(message);
      setData({
        currentMonth: buildEmptyMetrics(year, month),
        currentYear: buildEmptyMetrics(year)
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return { data, isLoading, error, refresh: loadDashboard };
}

export function useTargets() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTargets = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await request<ApiTarget[]>("/api/performance/targets");
      setTargets(sortTargets(dedupeTargets(response.map(deserializeTarget))));
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load targets";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTargets();
  }, [loadTargets]);

  const createTarget = useCallback(async (data: Partial<Target>) => {
    try {
      const response = await request<ApiTarget>("/api/performance/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: data.year,
          month: typeof data.month === "number" ? data.month : null,
          targetUnits: data.targetUnits,
          targetIncome: data.targetIncome
        })
      });
      const newTarget = deserializeTarget(response);
      setTargets((prev) =>
        sortTargets(dedupeTargets([...prev.filter((target) => target.id !== newTarget.id), newTarget]))
      );
      setError(null);
      return newTarget;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create target";
      setError(message);
      throw err instanceof Error ? err : new Error(message);
    }
  }, []);

  const updateTarget = useCallback(async (id: string, data: Partial<Target>) => {
    try {
      const response = await request<ApiTarget>(`/api/performance/targets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUnits: data.targetUnits,
          targetIncome: data.targetIncome
        })
      });
      const updatedTarget = deserializeTarget(response);
      setTargets((prev) =>
        sortTargets(prev.map((target) => (target.id === id ? updatedTarget : target)))
      );
      setError(null);
      return updatedTarget;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update target";
      setError(message);
      throw err instanceof Error ? err : new Error(message);
    }
  }, []);

  const deleteTarget = useCallback(async (id: string) => {
    try {
      await request(`/api/performance/targets/${id}`, {
        method: "DELETE"
      });
      setTargets((prev) => prev.filter((target) => target.id !== id));
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete target";
      setError(message);
      throw err instanceof Error ? err : new Error(message);
    }
  }, []);

  return {
    targets,
    isLoading,
    error,
    createTarget,
    updateTarget,
    deleteTarget,
    refresh: loadTargets
  };
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await request<ApiExpense[]>("/api/performance/expenses");
      setExpenses(sortExpenses(response.map(deserializeExpense)));
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load expenses";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadExpenses();
  }, [loadExpenses]);

  const createExpense = useCallback(async (data: Partial<Expense>) => {
    try {
      const response = await request<ApiExpense>("/api/performance/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: data.category,
          amount: data.amount,
          description: data.description,
          date: formatDatePayload(data.date),
          receiptUrl: data.receiptUrl ?? null
        })
      });
      const newExpense = deserializeExpense(response);
      setExpenses((prev) => sortExpenses([...prev, newExpense]));
      setError(null);
      return newExpense;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create expense";
      setError(message);
      throw err instanceof Error ? err : new Error(message);
    }
  }, []);

  const updateExpense = useCallback(async (id: string, data: Partial<Expense>) => {
    try {
      const response = await request<ApiExpense>(`/api/performance/expenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: data.category,
          amount: data.amount,
          description: data.description,
          date: data.date ? formatDatePayload(data.date) : undefined,
          receiptUrl: data.receiptUrl ?? null
        })
      });
      const updatedExpense = deserializeExpense(response);
      setExpenses((prev) =>
        sortExpenses(prev.map((expense) => (expense.id === id ? updatedExpense : expense)))
      );
      setError(null);
      return updatedExpense;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update expense";
      setError(message);
      throw err instanceof Error ? err : new Error(message);
    }
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    try {
      await request(`/api/performance/expenses/${id}`, {
        method: "DELETE"
      });
      setExpenses((prev) => prev.filter((expense) => expense.id !== id));
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete expense";
      setError(message);
      throw err instanceof Error ? err : new Error(message);
    }
  }, []);

  const summary = useMemo(() => {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const byCategory = expenses.reduce<Record<string, number>>((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});

    return { total, byCategory };
  }, [expenses]);

  return {
    expenses,
    summary,
    isLoading,
    error,
    createExpense,
    updateExpense,
    deleteExpense,
    refresh: loadExpenses
  };
}

export function usePerformanceReports(year: number) {
  const [yearlyReport, setYearlyReport] = useState<PerformanceMetrics | null>(null);
  const [monthlyReports, setMonthlyReports] = useState<PerformanceMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await request<PerformanceReportsResponse>(
        `/api/performance/reports?year=${year}`
      );
      setYearlyReport(response.yearlyReport ?? buildEmptyMetrics(year));
      setMonthlyReports(
        response.monthlyReports && response.monthlyReports.length > 0
          ? response.monthlyReports
          : Array.from({ length: 12 }, (_, index) => buildEmptyMetrics(year, index + 1))
      );
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load performance reports";
      setError(message);
      setYearlyReport(buildEmptyMetrics(year));
      setMonthlyReports(Array.from({ length: 12 }, (_, index) => buildEmptyMetrics(year, index + 1)));
    } finally {
      setIsLoading(false);
    }
  }, [year]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  return { yearlyReport, monthlyReports, isLoading, error, refresh: loadReports };
}
