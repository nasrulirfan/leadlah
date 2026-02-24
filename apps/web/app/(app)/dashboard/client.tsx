"use client";

import { useTransition } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Home,
  CalendarClock,
  DollarSign,
  Target,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  StatsCard,
  PerformanceChart,
  ListingsDonut,
  RemindersTimeline,
  QuickActions,
  ActivityFeed,
} from "@/components/dashboard";
import type { DashboardReminders } from "@/lib/reminders/types";
import {
  completeReminderAction,
  dismissReminderAction,
} from "@/app/actions/reminders";
import type { DashboardActivity } from "@/lib/dashboard/types";

interface DashboardClientProps {
  listingCounts: Record<string, number>;
  reminders: DashboardReminders;
  timezone: string;
  activities: DashboardActivity[];
  performanceData: {
    target: number;
    commission: number;
    expenses: number;
    netIncome: number;
    unitsTarget: number;
    unitsClosed: number;
  };
  monthlyData: Array<{
    month: string;
    commission: number;
    expenses: number;
    target: number;
  }>;
}

export function DashboardClient({
  listingCounts,
  reminders,
  timezone,
  activities,
  performanceData,
  monthlyData,
}: DashboardClientProps) {
  const [_isPending, startTransition] = useTransition();

  const handleComplete = (id: string) => {
    startTransition(() => {
      completeReminderAction(id);
    });
  };

  const handleDismiss = (id: string) => {
    startTransition(() => {
      dismissReminderAction(id);
    });
  };

  const active = listingCounts["Active"] ?? 0;
  const sold = listingCounts["Sold"] ?? 0;
  const pending = listingCounts["Pending"] ?? 0;
  const expired = listingCounts["Expired"] ?? 0;

  const totalReminders =
    reminders.today.length +
    reminders.tomorrow.length +
    reminders.thisWeek.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <Sparkles className="h-6 w-6 text-amber-500" />
          </div>
          <p className="mt-1 text-muted-foreground">
            Welcome back! Here&apos;s your business at a glance.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="secondary">
            <Link href="/listings" className="gap-2">
              <Home className="h-4 w-4" />
              View Listings
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/appointments" className="gap-2">
              <CalendarClock className="h-4 w-4" />
              Appointments
            </Link>
          </Button>
          <Button asChild>
            <Link href="/calculators" className="gap-2">
              Open Calculators
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Listings"
          value={active}
          subtitle={`${sold} sold this month`}
          icon={Home}
          colorScheme="blue"
          delay={0}
        />
        <StatsCard
          title="Commission Earned"
          value={`RM ${(performanceData.commission / 1000).toFixed(0)}k`}
          subtitle={`Commission target: RM ${(performanceData.target / 1000).toFixed(0)}k`}
          icon={DollarSign}
          colorScheme="emerald"
          progress={{
            value: performanceData.commission,
            max: performanceData.target,
          }}
          delay={0.1}
        />
        <StatsCard
          title="Net Profit"
          value={`RM ${(performanceData.netIncome / 1000).toFixed(0)}k`}
          subtitle={`Expenses: RM ${(performanceData.expenses / 1000).toFixed(1)}k`}
          icon={TrendingUp}
          colorScheme="violet"
          trend={{ value: 12, isPositive: true }}
          delay={0.2}
        />
        <StatsCard
          title="Units Closed"
          value={performanceData.unitsClosed}
          subtitle={`Target: ${performanceData.unitsTarget} units`}
          icon={Target}
          colorScheme="amber"
          progress={{
            value: performanceData.unitsClosed,
            max: performanceData.unitsTarget,
          }}
          delay={0.3}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PerformanceChart data={monthlyData} />
        </div>
        <ListingsDonut
          data={{
            active,
            sold,
            pending,
            expired,
          }}
        />
      </div>

      {/* Reminders & Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RemindersTimeline
          reminders={reminders}
          timezone={timezone}
          onComplete={handleComplete}
          onDismiss={handleDismiss}
        />
        <ActivityFeed activities={activities} />
      </div>

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}
