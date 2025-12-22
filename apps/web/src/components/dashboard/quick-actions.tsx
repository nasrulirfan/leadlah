"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Calculator,
  CalendarClock,
  Home,
  TrendingUp,
  PlusCircle,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const actions = [
  {
    title: "Create Listing",
    description: "Add a new property listing",
    icon: PlusCircle,
    href: "/listings",
    color: "from-blue-500 to-blue-600",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
  },
  {
    title: "Appointments",
    description: "Viewings & schedule",
    icon: CalendarClock,
    href: "/appointments",
    color: "from-rose-500 to-rose-600",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-500",
  },
  {
    title: "Loan Calculator",
    description: "Check loan eligibility",
    icon: Calculator,
    href: "/calculators",
    color: "from-emerald-500 to-emerald-600",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
  },
  {
    title: "View Performance",
    description: "Track your targets",
    icon: TrendingUp,
    href: "/performance",
    color: "from-violet-500 to-violet-600",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-500",
  },
  {
    title: "All Listings",
    description: "Manage your inventory",
    icon: Home,
    href: "/listings",
    color: "from-amber-500 to-amber-600",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
  },
];

const calculators = [
  { name: "Loan Eligibility", icon: "💰" },
  { name: "Legal Fee & Stamp Duty", icon: "📋" },
  { name: "ROI Calculator", icon: "📈" },
];

export function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="space-y-6"
    >
      {/* Quick Action Cards */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
            >
              <Link href={action.href}>
                <Card className="group relative overflow-hidden p-5 transition-all hover:shadow-lg hover:-translate-y-1">
                  <div className="flex items-start justify-between">
                    <div className={cn("rounded-xl p-3", action.iconBg)}>
                      <action.icon className={cn("h-5 w-5", action.iconColor)} />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
                  </div>
                  <div className="mt-4">
                    <h4 className="font-semibold text-foreground">{action.title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                  {/* Hover gradient effect */}
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-5",
                      action.color
                    )}
                  />
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Calculator Shortcuts */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Quick Calculators</h3>
            <p className="text-sm text-muted-foreground">
              Financial tools at your fingertips
            </p>
          </div>
          <Link
            href="/calculators"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {calculators.map((calc, index) => (
            <motion.div
              key={calc.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
            >
              <Link href="/calculators">
                <div className="group flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-4 transition-all hover:bg-muted/50 hover:border-primary/20">
                  <span className="text-2xl">{calc.icon}</span>
                  <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {calc.name}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
