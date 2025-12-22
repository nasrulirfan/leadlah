import Link from "next/link";
import { requireSession } from "@/lib/session";
import { fetchDashboardReminders } from "@/data/reminders";
import { fetchProfile } from "@/data/profile";
import { fetchListingStatusCounts } from "@/data/listings";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { completeReminderAction, dismissReminderAction } from "./actions";
import { formatDateTime, formatTime, zonedDateKey } from "@/lib/reminders/time";
import type { StoredReminder } from "@/lib/reminders/types";

const target = 500000;
const commissions = 180000;
const expenses = 32000;
const net = commissions - expenses;
const progress = Math.min(100, Math.round((net / target) * 100));

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
  if (reminder.metadata && typeof reminder.metadata === "object" && "kind" in reminder.metadata) {
    if (reminder.metadata.kind === "EVENT") {
      return `${reminder.message} at ${formatTime(reminder.dueAt, timeZone)}`;
    }
    if (reminder.metadata.kind === "FOLLOW_UP") {
      return reminder.metadata.contactName ? `Follow up with ${reminder.metadata.contactName}` : reminder.message;
    }
    if (reminder.metadata.kind === "PLATFORM_EXPIRY") {
      const expiresAt = reminder.metadata.expiresAt ? new Date(reminder.metadata.expiresAt) : null;
      if (!expiresAt) {
        return reminder.message;
      }
      const now = new Date();
      const todayKey = zonedDateKey(now, timeZone);
      const tomorrowKey = zonedDateKey(new Date(now.getTime() + 24 * 60 * 60 * 1000), timeZone);
      const expiresKey = zonedDateKey(expiresAt, timeZone);
      const suffix = expiresKey === todayKey ? "expires today" : expiresKey === tomorrowKey ? "expires tomorrow" : `expires ${formatDateTime(expiresAt, timeZone)}`;
      return `${reminder.metadata.provider} ${suffix}`;
    }
  }
  return reminder.message;
}

export default async function DashboardPage() {
  const session = await requireSession();
  const profile = await fetchProfile(session.user.id);
  const listingCounts = await fetchListingStatusCounts();
  const reminders = await fetchDashboardReminders(session.user.id, profile.timezone);

  const active = listingCounts["Active"] ?? 0;
  const sold = listingCounts["Sold"] ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agent Overview</h1>
          <p className="text-sm text-muted-foreground">Stay on top of listings, reminders, and profitability.</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="secondary">
            <Link href="/listings">Create Listing</Link>
          </Button>
          <Button asChild>
            <Link href="/calculators">Open Calculators</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <h3 className="text-sm font-semibold text-muted-foreground">Active Listings</h3>
          <p className="mt-2 text-3xl font-bold text-brand-600">{active}</p>
          <p className="text-xs text-muted-foreground">vs Sold: {sold}</p>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-muted-foreground">Action Required</h3>
          <div className="mt-2 space-y-2">
            {reminders.today.length === 0 ? (
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">No reminders due today.</div>
            ) : (
              reminders.today.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2">
                  <span className="text-sm text-foreground">
                    {item.listingName ? `${item.listingName} — ` : ""}
                    {renderReminderSummary(item, profile.timezone)}
                  </span>
                  <Badge tone={badgeToneFor(item.type)}>{item.type}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-muted-foreground">Profit vs Target</h3>
          <div className="mt-2 text-3xl font-bold text-emerald-600">RM {net.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Target: RM {target.toLocaleString()}</p>
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }} />
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Reminders</h3>
            <p className="text-sm text-muted-foreground">
              Today, tomorrow, and the rest of the week — based on your timezone ({profile.timezone}).
            </p>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link href="/listings">Add reminders</Link>
          </Button>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {([
            { label: "Today", items: reminders.today },
            { label: "Tomorrow", items: reminders.tomorrow },
            { label: "This Week", items: reminders.thisWeek }
          ] as const).map((group) => (
            <div key={group.label} className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-foreground">{group.label.toUpperCase()}</h4>
                <span className="text-xs text-muted-foreground">{group.items.length}</span>
              </div>
              <div className="mt-3 space-y-2">
                {group.items.length === 0 ? (
                  <div className="rounded-lg bg-background/60 px-3 py-2 text-sm text-muted-foreground">
                    No reminders.
                  </div>
                ) : (
                  group.items.slice(0, 8).map((item) => (
                    <div key={item.id} className="rounded-lg bg-background/70 px-3 py-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {item.listingName ?? "General"}
                          </p>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {renderReminderSummary(item, profile.timezone)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(item.dueAt, profile.timezone)}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <Badge tone={badgeToneFor(item.type)}>{item.type}</Badge>
                          <div className="flex gap-2">
                            <form action={completeReminderAction.bind(null, item.id)}>
                              <Button type="submit" size="sm" variant="secondary">
                                Done
                              </Button>
                            </form>
                            <form action={dismissReminderAction.bind(null, item.id)}>
                              <Button type="submit" size="sm" variant="outline">
                                Dismiss
                              </Button>
                            </form>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Quick Calculators</h3>
            <p className="text-sm text-muted-foreground">Loan eligibility, legal fees, stamp duty, ROI, and more.</p>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link href="/calculators">Open All Calculators</Link>
          </Button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {["Loan Eligibility", "Legal Fee & Stamp Duty", "ROI"].map((item) => (
            <div key={item} className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm font-semibold text-foreground">
              {item}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
