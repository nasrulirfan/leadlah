"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import { usePerformanceReports } from "@/lib/performance/hooks";

export function PerformanceReports() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { yearlyReport, monthlyReports, isLoading, error, refresh } = usePerformanceReports(selectedYear);

  const handleDownloadReport = async (period: string) => {
    // TODO: Implement PDF generation
    console.log("Downloading report for:", period);
  };

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Loading reports...</div>;
  }

  return (
    <div className="space-y-6">
      {error && !isLoading && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span>{error}</span>
          <Button size="sm" variant="ghost" onClick={() => refresh()}>
            Retry
          </Button>
        </div>
      )}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Annual Summary {selectedYear}</CardTitle>
            <div className="flex gap-3">
              <select
                className="rounded-md border border-input bg-background text-foreground pl-3 pr-8 py-2 text-sm appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_8px_center] bg-no-repeat cursor-pointer"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <Button size="sm" variant="secondary" onClick={() => handleDownloadReport(`${selectedYear}`)}>
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <p className="text-xs font-medium text-muted-foreground">Total Units Closed</p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {yearlyReport?.actual.units || 0}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Target: {yearlyReport?.target.units || 0} units
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <p className="text-xs font-medium text-muted-foreground">Total Commission</p>
              <p className="mt-2 text-3xl font-bold text-emerald-600">
                RM {((yearlyReport?.actual.commission || 0) / 1000).toFixed(0)}k
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Target: RM {((yearlyReport?.target.income || 0) / 1000).toFixed(0)}k
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <p className="text-xs font-medium text-muted-foreground">Total Expenses</p>
              <p className="mt-2 text-3xl font-bold text-amber-600">
                RM {((yearlyReport?.actual.expenses || 0) / 1000).toFixed(1)}k
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {((yearlyReport?.actual.expenses || 0) / (yearlyReport?.actual.commission || 1) * 100).toFixed(1)}% of commission
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <p className="text-xs font-medium text-muted-foreground">Net Profit</p>
              <p className="mt-2 text-3xl font-bold text-violet-600">
                RM {((yearlyReport?.actual.netIncome || 0) / 1000).toFixed(1)}k
              </p>
              <div className="mt-2">
                {(yearlyReport?.actual.netIncome || 0) >= (yearlyReport?.target.income || 0) ? (
                  <Badge variant="success" className="text-xs">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    Target Achieved
                  </Badge>
                ) : (
                  <Badge variant="warning" className="text-xs">
                    <TrendingDown className="mr-1 h-3 w-3" />
                    Below Target
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground">
                  <th className="pb-3">Month</th>
                  <th className="pb-3 text-right">Units</th>
                  <th className="pb-3 text-right">Commission</th>
                  <th className="pb-3 text-right">Expenses</th>
                  <th className="pb-3 text-right">Net Income</th>
                  <th className="pb-3 text-right">Progress</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {monthlyReports?.map((report) => {
                  const monthName = new Date(report.period.year, (report.period.month || 1) - 1).toLocaleString('default', { month: 'long' });
                  const progressPercent = Math.min(100, report.progress.incomePercent);

                  return (
                    <tr key={`${report.period.year}-${report.period.month}`} className="border-b border-border">
                      <td className="py-3 font-medium text-foreground">{monthName}</td>
                      <td className="py-3 text-right text-foreground">
                        {report.actual.units} / {report.target.units}
                      </td>
                      <td className="py-3 text-right font-semibold text-emerald-600">
                        RM {(report.actual.commission / 1000).toFixed(1)}k
                      </td>
                      <td className="py-3 text-right font-semibold text-amber-600">
                        RM {(report.actual.expenses / 1000).toFixed(1)}k
                      </td>
                      <td className="py-3 text-right font-semibold text-violet-600">
                        RM {(report.actual.netIncome / 1000).toFixed(1)}k
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full bg-emerald-500"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-muted-foreground">
                            {progressPercent.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownloadReport(`${report.period.year}-${report.period.month}`)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!monthlyReports?.length && (
              <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground">No data available for {selectedYear}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
