import Link from "next/link";
import { requireSession } from "@/lib/session";
import { listings, reminders } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const target = 500000;
const commissions = 180000;
const expenses = 32000;
const net = commissions - expenses;
const progress = Math.min(100, Math.round((net / target) * 100));

export default async function DashboardPage() {
  await requireSession();

  const active = listings.filter((l) => l.status === "Active").length;
  const sold = listings.filter((l) => l.status === "Sold").length;
  const actionRequired = reminders.slice(0, 3);

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
            {actionRequired.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                <span className="text-sm text-foreground">{item.message}</span>
                <Badge tone="warning">{item.type}</Badge>
              </div>
            ))}
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
