"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, DollarSign, Wallet } from "lucide-react";
import { usePerformanceData } from "@/lib/performance/hooks";

export function PerformanceOverview() {
  const { data, isLoading, error } = usePerformanceData();

  if (isLoading) {
    return <PerformanceOverviewSkeleton />;
  }

  const metrics = data?.currentMonth || {
    target: { units: 0, income: 0 },
    actual: { units: 0, commission: 0, expenses: 0, netIncome: 0 },
    progress: { unitsPercent: 0, incomePercent: 0 }
  };

  const unitsProgress = Math.min(100, metrics.progress.unitsPercent);
  const incomeProgress = Math.min(100, metrics.progress.incomePercent);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2.5 dark:bg-blue-950">
                <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Units Closed</p>
                <p className="text-2xl font-bold text-foreground">
                  {metrics.actual.units}{" "}
                  <span className="text-sm text-muted-foreground">/ {metrics.target.units}</span>
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold text-foreground">{unitsProgress.toFixed(0)}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${unitsProgress}%` }}
              />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2.5 dark:bg-emerald-950">
                <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Commission</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  RM {(metrics.actual.commission / 1000).toFixed(0)}k
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Target: RM {(metrics.target.income / 1000).toFixed(0)}k
              </span>
              <span className="font-semibold text-foreground">{incomeProgress.toFixed(0)}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${incomeProgress}%` }}
              />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2.5 dark:bg-amber-950">
                <Wallet className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Expenses</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  RM {(metrics.actual.expenses / 1000).toFixed(1)}k
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Badge variant="warning" className="text-xs">
              {metrics.actual.commission > 0
                ? ((metrics.actual.expenses / metrics.actual.commission) * 100).toFixed(1)
                : 0}
              % of commission
            </Badge>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-violet-100 p-2.5 dark:bg-violet-950">
                <TrendingUp className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Net Income</p>
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                  RM {(metrics.actual.netIncome / 1000).toFixed(1)}k
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Badge
              variant={metrics.actual.netIncome >= metrics.target.income ? "success" : "default"}
              className="text-xs"
            >
              {metrics.actual.netIncome >= metrics.target.income ? "Target Achieved!" : "Keep Going!"}
            </Badge>
          </div>
        </Card>
      </div>
      {error && (
        <p className="text-sm text-destructive">
          Metrics may be delayed: {error}
        </p>
      )}
    </div>
  );
}

function PerformanceOverviewSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <div className="h-24 animate-pulse rounded-lg bg-muted" />
        </Card>
      ))}
    </div>
  );
}
