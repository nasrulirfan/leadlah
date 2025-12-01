import { notFound } from "next/navigation";
import { ProcessStage, verifyOwnerViewToken } from "@leadlah/core";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { decodeOwnerViewToken } from "@/lib/owner-link";
import { fetchListingById } from "@/data/listings";
import { fetchProcessLogForListing } from "@/data/process-logs";

type Params = { token: string };

const formatDate = (value?: Date) => {
  if (!value) {
    return null;
  }
  return value.toLocaleDateString("en-MY", { dateStyle: "medium" });
};

export default async function OwnerViewPage({ params }: { params: Params }) {
  const ownerToken = decodeOwnerViewToken(params.token);
  if (!ownerToken) {
    notFound();
  }
  const ownerLinkSecret = process.env.OWNER_LINK_SECRET;
  if (!ownerLinkSecret) {
    throw new Error("OWNER_LINK_SECRET must be configured for owner view links.");
  }

  const listing = await fetchListingById(ownerToken.listingId);
  if (!listing || !verifyOwnerViewToken(ownerToken, listing.id, ownerLinkSecret)) {
    notFound();
  }

  const timeline = await fetchProcessLogForListing(listing.id);
  const steps = Object.values(ProcessStage);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Owner Timeline</h1>
        <p className="text-sm text-slate-500">
          Real-time updates for <span className="font-semibold text-slate-700">{listing.propertyName}</span>. Link valid
          until {ownerToken.expiresAt.toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" })}.
        </p>
      </div>
      <Card>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Listing</p>
            <p className="text-lg font-semibold text-slate-900">{listing.propertyName}</p>
            <p className="text-sm text-slate-600">
              {listing.type} • {listing.location}
            </p>
          </div>
          <Badge tone="info">Read-only</Badge>
        </div>
        <div className="mt-6 space-y-4">
          {steps.map((stage) => {
            const log = timeline.find((entry) => entry.stage === stage);
            const statusLabel = log?.completedAt ? `Completed ${formatDate(log.completedAt)}` : "Pending";
            return (
              <div
                key={stage}
                className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{stage}</p>
                    <p className="text-xs text-slate-500">{log?.notes ?? "In progress"}</p>
                    {log?.actor ? (
                      <p className="text-[11px] text-slate-500/80">Handled by {log.actor}</p>
                    ) : null}
                  </div>
                  <Badge tone={log?.completedAt ? "success" : "neutral"}>{statusLabel}</Badge>
                </div>
                {log?.viewings?.length ? (
                  <ul className="mt-3 space-y-1 text-xs text-slate-600">
                    {log.viewings.map((viewing) => (
                      <li
                        key={viewing.id}
                        className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-2 first:border-t-0 first:pt-0"
                      >
                        <span className="font-medium text-slate-800">{viewing.name}</span>
                        <span className="text-slate-500">
                          {viewing.viewedAt ? viewing.viewedAt.toLocaleDateString("en-MY") : "Scheduled"}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
