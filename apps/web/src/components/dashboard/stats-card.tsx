"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  progress?: {
    value: number;
    max: number;
  };
  colorScheme: "blue" | "emerald" | "amber" | "violet" | "rose";
  delay?: number;
}

const colorSchemes = {
  blue: {
    bg: "bg-gradient-to-br from-blue-500 to-blue-600",
    iconBg: "bg-blue-400/30",
    progressBg: "bg-blue-400/30",
    progressFill: "bg-white",
    text: "text-white",
    subtitleText: "text-blue-100",
  },
  emerald: {
    bg: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    iconBg: "bg-emerald-400/30",
    progressBg: "bg-emerald-400/30",
    progressFill: "bg-white",
    text: "text-white",
    subtitleText: "text-emerald-100",
  },
  amber: {
    bg: "bg-gradient-to-br from-amber-500 to-amber-600",
    iconBg: "bg-amber-400/30",
    progressBg: "bg-amber-400/30",
    progressFill: "bg-white",
    text: "text-white",
    subtitleText: "text-amber-100",
  },
  violet: {
    bg: "bg-gradient-to-br from-violet-500 to-violet-600",
    iconBg: "bg-violet-400/30",
    progressBg: "bg-violet-400/30",
    progressFill: "bg-white",
    text: "text-white",
    subtitleText: "text-violet-100",
  },
  rose: {
    bg: "bg-gradient-to-br from-rose-500 to-rose-600",
    iconBg: "bg-rose-400/30",
    progressBg: "bg-rose-400/30",
    progressFill: "bg-white",
    text: "text-white",
    subtitleText: "text-rose-100",
  },
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  progress,
  colorScheme,
  delay = 0,
}: StatsCardProps) {
  const colors = colorSchemes[colorScheme];
  const progressPercent = progress ? Math.min(100, (progress.value / progress.max) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 shadow-lg",
        colors.bg
      )}
    >
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className={cn("text-sm font-medium", colors.subtitleText)}>{title}</p>
            <p className={cn("mt-2 text-3xl font-bold tracking-tight", colors.text)}>
              {value}
            </p>
            {subtitle && (
              <p className={cn("mt-1 text-sm", colors.subtitleText)}>{subtitle}</p>
            )}
          </div>
          <div className={cn("rounded-xl p-3", colors.iconBg)}>
            <Icon className={cn("h-6 w-6", colors.text)} />
          </div>
        </div>

        {trend && (
          <div className="mt-4 flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold",
                trend.isPositive
                  ? "bg-white/20 text-white"
                  : "bg-white/20 text-white"
              )}
            >
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </span>
            <span className={cn("text-xs", colors.subtitleText)}>vs last month</span>
          </div>
        )}

        {progress && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className={colors.subtitleText}>Progress</span>
              <span className={cn("font-semibold", colors.text)}>
                {progressPercent.toFixed(0)}%
              </span>
            </div>
            <div className={cn("mt-2 h-2 w-full overflow-hidden rounded-full", colors.progressBg)}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, delay: delay + 0.3 }}
                className={cn("h-full rounded-full", colors.progressFill)}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
