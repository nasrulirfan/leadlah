import Link from "next/link";
import { requireSession } from "@/lib/session";
import { subscriptionState, billingHistory } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function BillingPage() {
  await requireSession();

  const paymentFailed = subscriptionState.status === "PAST_DUE";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Subscription & Billing</h1>
          <p className="text-sm text-muted-foreground">Manage plan, invoices, and payment method via HitPay.</p>
        </div>
        <Button variant="secondary" size="sm">Contact Support</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm font-semibold text-muted-foreground">Current Status</p>
          <div className="mt-2 flex items-center gap-2">
            <Badge tone={paymentFailed ? "warning" : "success"}>{subscriptionState.status}</Badge>
            {subscriptionState.nextBillingAt && (
              <span className="text-xs text-muted-foreground">
                Next billing: {subscriptionState.nextBillingAt.toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <p>Unlimited Listings</p>
            <p>Branded PDF Receipts</p>
            <p>Fishbone Tracker & Reminders</p>
          </div>
        </Card>

        <Card className="md:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">LeadLah Pro</p>
              <p className="text-3xl font-bold text-foreground">RM129 <span className="text-base font-semibold text-muted-foreground">/ month</span></p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary">Start 7-Day Free Trial</Button>
              <Button>Update Payment Method</Button>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">HitPay powers recurring billing with FPX & Card support. Cancellations are immediate; access switches to read-only.</p>
        </Card>
      </div>

      {paymentFailed && (
        <Card className="border-red-200 bg-red-50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-red-800">Payment Failed</h3>
              <p className="text-sm text-red-700">
                Retry payment or update card to continue access. Grace period: 3 days.
              </p>
              <p className="text-sm font-semibold text-red-800">
                Failed invoice: RM {billingHistory.find((i) => i.status === "Failed")?.amount ?? 0}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="border-red-200 text-red-700">Retry Payment</Button>
              <Button variant="danger">Update Card</Button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Invoice History</h3>
          <Button variant="secondary" size="sm">Download All</Button>
        </div>
        <div className="mt-4 divide-y divide-slate-100 text-sm">
          {billingHistory.map((invoice) => (
            <div key={invoice.id} className="flex flex-wrap items-center justify-between py-3">
              <div>
                <p className="font-semibold text-slate-800">{invoice.id}</p>
                <p className="text-xs text-muted-foreground">{invoice.date.toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-800">RM {invoice.amount}</span>
                <Badge tone={invoice.status === "Paid" ? "success" : "danger"}>{invoice.status}</Badge>
                <Link href={`#invoice-${invoice.id}`} className="text-brand-600 underline">
                  Download
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="ghost" className="text-muted-foreground">Cancel Subscription</Button>
        <Button variant="secondary">Open HitPay Portal</Button>
      </div>
    </div>
  );
}
