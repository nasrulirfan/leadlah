import { notFound } from "next/navigation";
import { verifyOwnerViewToken, ProcessStage } from "@leadlah/core";
import { ownerViewToken, listings, processLogs } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Params = { token: string };

export default function OwnerViewPage({ params }: { params: Params }) {
  const valid =
    params.token === ownerViewToken.token && verifyOwnerViewToken(ownerViewToken, ownerViewToken.listingId);

  if (!valid) {
    notFound();
  }

  const listing = listings.find((l) => l.id === ownerViewToken.listingId);
  if (!listing) {
    notFound();
  }

  const steps = Object.values(ProcessStage);
  const timeline = processLogs[listing.id] ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Owner Timeline</h1>
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Listing</p>
            <p className="text-lg font-semibold text-slate-900">{listing.propertyName}</p>
          </div>
          <Badge tone="info">Read-only</Badge>
        </div>
        <div className="mt-6 space-y-4">
          {steps.map((stage) => {
            const log = timeline.find((item) => item.stage === stage);
            return (
              <div
                key={stage}
                className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{stage}</p>
                  <p className="text-xs text-slate-500">{log?.notes ?? "In progress"}</p>
                </div>
                <Badge tone={log?.completedAt ? "success" : "neutral"}>
                  {log?.completedAt ? `Done ${log.completedAt.toLocaleDateString()}` : "Pending"}
                </Badge>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
