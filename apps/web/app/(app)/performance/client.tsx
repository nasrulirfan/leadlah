"use client";

import { motion } from "framer-motion";
import { Sparkles, TrendingUp } from "lucide-react";

import { PageHero } from "@/components/app/PageHero";
import { PerformanceOverview } from "@/components/performance/performance-overview";
import { TargetManager } from "@/components/performance/target-manager";
import { ExpenseTracker } from "@/components/performance/expense-tracker";
import { CommissionManager } from "@/components/performance/commission-manager";
import { PerformanceReports } from "@/components/performance/performance-reports";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function PerformanceClient({ reportsEnabled }: { reportsEnabled: boolean }) {
  const tabCols = reportsEnabled ? "grid-cols-4" : "grid-cols-3";

  return (
    <div className="space-y-6">
      <PageHero
        title="Performance"
        description="Track targets, expenses, and business profitability across the month."
        icon={<TrendingUp />}
        badges={
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
            <Sparkles className="h-4 w-4 text-amber-400" />
            Real-time metrics
          </div>
        }
      />

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <PerformanceOverview />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}>
        <Tabs defaultValue="targets" className="w-full">
          <TabsList
            className={[
              "grid h-auto w-full rounded-2xl bg-muted/50 p-1",
              tabCols,
            ].join(" ")}
          >
            <TabsTrigger value="targets" className="py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Targets
            </TabsTrigger>
            <TabsTrigger value="expenses" className="py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Expenses
            </TabsTrigger>
            <TabsTrigger value="commissions" className="py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Commissions
            </TabsTrigger>
            {reportsEnabled && (
              <TabsTrigger value="reports" className="py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Reports
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="targets" className="mt-6">
            <TargetManager />
          </TabsContent>

          <TabsContent value="expenses" className="mt-6">
            <ExpenseTracker />
          </TabsContent>

          <TabsContent value="commissions" className="mt-6">
            <CommissionManager />
          </TabsContent>

          {reportsEnabled && (
            <TabsContent value="reports" className="mt-6">
              <PerformanceReports />
            </TabsContent>
          )}
        </Tabs>
      </motion.div>
    </div>
  );
}
