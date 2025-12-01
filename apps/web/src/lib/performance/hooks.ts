"use client";

import { useState, useEffect } from "react";
import type { Target, Expense, PerformanceMetrics } from "@leadlah/core";

// Mock data for demonstration - replace with actual API calls
export function usePerformanceData() {
  const [data, setData] = useState<{
    currentMonth: PerformanceMetrics;
    currentYear: PerformanceMetrics;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setData({
        currentMonth: {
          period: { year: 2025, month: 12 },
          target: { units: 10, income: 50000 },
          actual: {
            units: 7,
            commission: 38500,
            expenses: 5200,
            netIncome: 33300
          },
          progress: {
            unitsPercent: 70,
            incomePercent: 66.6
          }
        },
        currentYear: {
          period: { year: 2025 },
          target: { units: 100, income: 500000 },
          actual: {
            units: 78,
            commission: 425000,
            expenses: 48000,
            netIncome: 377000
          },
          progress: {
            unitsPercent: 78,
            incomePercent: 75.4
          }
        }
      });
      setIsLoading(false);
    }, 500);
  }, []);

  return { data, isLoading };
}

export function useTargets() {
  const [targets, setTargets] = useState<Target[]>([
    {
      id: "1",
      userId: "user1",
      year: 2025,
      month: 12,
      targetUnits: 10,
      targetIncome: 50000,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "2",
      userId: "user1",
      year: 2025,
      targetUnits: 100,
      targetIncome: 500000,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  const createTarget = async (data: Partial<Target>) => {
    const newTarget: Target = {
      id: Math.random().toString(36).substr(2, 9),
      userId: "user1",
      year: data.year!,
      month: data.month,
      targetUnits: data.targetUnits!,
      targetIncome: data.targetIncome!,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setTargets([...targets, newTarget]);
  };

  const updateTarget = async (id: string, data: Partial<Target>) => {
    setTargets(targets.map(t => t.id === id ? { ...t, ...data, updatedAt: new Date() } : t));
  };

  const deleteTarget = async (id: string) => {
    setTargets(targets.filter(t => t.id !== id));
  };

  return { targets, createTarget, updateTarget, deleteTarget };
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: "1",
      userId: "user1",
      category: "Fuel" as any,
      amount: 250,
      description: "Fuel for property viewings",
      date: new Date("2025-12-15"),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "2",
      userId: "user1",
      category: "Advertising" as any,
      amount: 1500,
      description: "Facebook ads campaign",
      date: new Date("2025-12-10"),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: "3",
      userId: "user1",
      category: "Client Entertainment" as any,
      amount: 180,
      description: "Client lunch meeting",
      date: new Date("2025-12-08"),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  const summary = {
    total: expenses.reduce((sum, exp) => sum + exp.amount, 0),
    byCategory: expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>)
  };

  const createExpense = async (data: Partial<Expense>) => {
    const newExpense: Expense = {
      id: Math.random().toString(36).substr(2, 9),
      userId: "user1",
      category: data.category!,
      amount: data.amount!,
      description: data.description!,
      date: data.date!,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setExpenses([...expenses, newExpense]);
  };

  const updateExpense = async (id: string, data: Partial<Expense>) => {
    setExpenses(expenses.map(e => e.id === id ? { ...e, ...data, updatedAt: new Date() } : e));
  };

  const deleteExpense = async (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  return { expenses, summary, createExpense, updateExpense, deleteExpense };
}

export function usePerformanceReports(year: number) {
  const [yearlyReport, setYearlyReport] = useState<PerformanceMetrics | null>(null);
  const [monthlyReports, setMonthlyReports] = useState<PerformanceMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setYearlyReport({
        period: { year },
        target: { units: 100, income: 500000 },
        actual: {
          units: 78,
          commission: 425000,
          expenses: 48000,
          netIncome: 377000
        },
        progress: {
          unitsPercent: 78,
          incomePercent: 75.4
        }
      });

      const months = Array.from({ length: 12 }, (_, i) => ({
        period: { year, month: i + 1 },
        target: { units: 8, income: 40000 },
        actual: {
          units: Math.floor(Math.random() * 10),
          commission: Math.floor(Math.random() * 50000),
          expenses: Math.floor(Math.random() * 8000),
          netIncome: 0
        },
        progress: {
          unitsPercent: 0,
          incomePercent: 0
        }
      }));

      months.forEach(m => {
        m.actual.netIncome = m.actual.commission - m.actual.expenses;
        m.progress.unitsPercent = (m.actual.units / m.target.units) * 100;
        m.progress.incomePercent = (m.actual.netIncome / m.target.income) * 100;
      });

      setMonthlyReports(months);
      setIsLoading(false);
    }, 500);
  }, [year]);

  return { yearlyReport, monthlyReports, isLoading };
}
