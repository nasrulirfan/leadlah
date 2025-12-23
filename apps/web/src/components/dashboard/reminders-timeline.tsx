"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Clock, CheckCircle2, XCircle, Calendar, Bell } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StoredReminder } from "@/lib/reminders/types";
import { formatDateTime, formatTime, zonedDateKey } from "@/lib/reminders/time";

interface RemindersTimelineProps {
  reminders: {
    today: StoredReminder[];
    tomorrow: StoredReminder[];
    thisWeek: StoredReminder[];
  };
  timezone: string;
  onComplete: (id: string) => void;
  onDismiss: (id: string) => void;
}

function badgeToneFor(type: string) {
  if (type === "PLATFORM_LISTING_EXPIRY" || type === "PORTAL_EXPIRY") {
    return "warning" as const;
  }
  if (type === "LEAD_FOLLOWUP") {
    return "info" as const;
  }
  if (type === "OWNER_UPDATE") {
    return "neutral" as const;
  }
  return "primary" as const;
}

function renderReminderSummary(reminder: StoredReminder, timeZone: string) {
  const metadata = reminder.metadata;
  if (metadata?.kind === "EVENT") {
    return `${reminder.message} at ${formatTime(reminder.dueAt, timeZone)}`;
  }
  if (metadata?.kind === "FOLLOW_UP") {
    return metadata.contactName ? `Follow up with ${metadata.contactName}` : reminder.message;
  }
  if (metadata?.kind === "PLATFORM_EXPIRY") {
    const expiresAt = metadata.expiresAt ? new Date(metadata.expiresAt) : null;
    if (!expiresAt) {
      return reminder.message;
    }
    const now = new Date();
    const todayKey = zonedDateKey(now, timeZone);
    const tomorrowKey = zonedDateKey(new Date(now.getTime() + 24 * 60 * 60 * 1000), timeZone);
    const expiresKey = zonedDateKey(expiresAt, timeZone);
    const suffix =
      expiresKey === todayKey
        ? "expires today"
        : expiresKey === tomorrowKey
        ? "expires tomorrow"
        : `expires ${formatDateTime(expiresAt, timeZone)}`;
    return `${metadata.provider} ${suffix}`;
  }
  return reminder.message;
}

function ReminderItem({
  reminder,
  timezone,
  onComplete,
  onDismiss,
  index,
}: {
  reminder: StoredReminder;
  timezone: string;
  onComplete: (id: string) => void;
  onDismiss: (id: string) => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group relative flex gap-4 pb-6 last:pb-0"
    >
      {/* Timeline line */}
      <div className="absolute left-[17px] top-10 h-[calc(100%-24px)] w-[2px] bg-gradient-to-b from-border to-transparent group-last:hidden" />

      {/* Timeline dot */}
      <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 ring-4 ring-background">
        <Bell className="h-4 w-4 text-primary" />
      </div>

      {/* Content */}
      <div className="flex-1 rounded-xl border border-border bg-card/50 p-4 transition-all hover:bg-card hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold text-foreground">
                {reminder.listingName ?? "General"}
              </p>
              <Badge tone={badgeToneFor(reminder.type)} className="shrink-0">
                {reminder.type.replace(/_/g, " ")}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {renderReminderSummary(reminder, timezone)}
            </p>
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDateTime(reminder.dueAt, timezone)}
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="h-8 gap-1"
              onClick={() => onComplete(reminder.id)}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Done
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1"
              onClick={() => onDismiss(reminder.id)}
            >
              <XCircle className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function RemindersTimeline({
  reminders,
  timezone,
  onComplete,
  onDismiss,
}: RemindersTimelineProps) {
  const allReminders = [
    ...reminders.today.map((r) => ({ ...r, group: "Today" })),
    ...reminders.tomorrow.map((r) => ({ ...r, group: "Tomorrow" })),
    ...reminders.thisWeek.map((r) => ({ ...r, group: "This Week" })),
  ];

  const hasReminders = allReminders.length > 0;
  const appointmentCount = allReminders.filter(
    (reminder) => reminder.metadata?.kind === "EVENT"
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Upcoming Reminders</h3>
            <p className="text-sm text-muted-foreground">
              {hasReminders
                ? `${allReminders.length} reminder${allReminders.length > 1 ? "s" : ""} this week`
                : "No upcoming reminders"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center">
            {appointmentCount ? (
              <Link
                href="/appointments"
                className="inline-flex items-center gap-1 font-semibold text-primary transition hover:underline"
              >
                {appointmentCount} appointment{appointmentCount > 1 ? "s" : ""}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : null}
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {timezone}
            </span>
          </div>
        </div>

        {hasReminders ? (
          <div className="max-h-[400px] overflow-y-auto pr-2">
            {allReminders.slice(0, 10).map((reminder, index) => (
              <ReminderItem
                key={reminder.id}
                reminder={reminder}
                timezone={timezone}
                onComplete={onComplete}
                onDismiss={onDismiss}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="mt-4 font-medium text-foreground">All caught up!</p>
            <p className="mt-1 text-sm text-muted-foreground">
              No reminders scheduled for this week
            </p>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
