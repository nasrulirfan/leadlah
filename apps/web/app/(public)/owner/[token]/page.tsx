import { notFound } from "next/navigation";
import {
  getProcessStageAliasStages,
  getProcessStageDisplayLabel,
  getProcessTimelineStages,
  ProcessStage,
  verifyOwnerViewToken,
} from "@leadlah/core";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { decodeOwnerViewToken } from "@/lib/owner-link";
import { fetchListingById } from "@/data/listings";
import { fetchProcessLogForListing } from "@/data/process-logs";
import { StickyHeader } from "@/components/nav/StickyHeader";

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
  const steps = getProcessTimelineStages({
    category: listing.category,
    tenure: listing.tenure,
  }).map((item) => item.stage);

  const findEntryForStage = (stage: ProcessStage) => {
    const direct = timeline.find((entry) => entry.stage === stage);
    if (direct) {
      return direct;
    }
    const aliases = getProcessStageAliasStages(stage);
    for (const aliasStage of aliases) {
      const aliasEntry = timeline.find((entry) => entry.stage === aliasStage);
      if (aliasEntry) {
        return aliasEntry;
      }
    }
    return undefined;
  };

  const offerStageIndex = steps.indexOf(ProcessStage.OFFER_STAGE);
  const viewingEntry = findEntryForStage(ProcessStage.VIEWING_RECORD);
  const buyerDisplay = (() => {
    const selectedId = viewingEntry?.successfulBuyerId;
    if (!selectedId) {
      return null;
    }
    const selected = viewingEntry?.viewings?.find((viewing) => viewing.id === selectedId);
    return selected?.name ?? null;
  })();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StickyHeader variant="owner" />

      {/* Hero Section with Gradient Background */}
      <div className="relative overflow-hidden hero-gradient">
        {/* Decorative Floating Orbs */}
        <div className="floating-orb absolute -top-20 -right-20 h-64 w-64 bg-primary/20" style={{ animationDelay: "0s" }} />
        <div className="floating-orb absolute top-10 left-10 h-32 w-32 bg-primary/10" style={{ animationDelay: "2s" }} />
        <div className="floating-orb absolute bottom-0 right-1/4 h-48 w-48 bg-primary/15" style={{ animationDelay: "4s" }} />

        <div className="relative mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <h1 className="text-3xl font-bold gradient-title sm:text-4xl">Owner Timeline</h1>
            <p className="mt-3 text-base text-muted-foreground">
              Real-time updates for <span className="font-semibold text-foreground">{listing.propertyName}</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground/80">
              Link valid until {ownerToken.expiresAt.toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto w-full max-w-3xl px-4 pb-16 sm:px-6 lg:px-8 -mt-4">
        <Card className="timeline-card overflow-hidden shadow-xl animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          {/* Listing Header */}
          <div className="flex flex-col gap-3 border-b border-border/50 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Listing</p>
              <p className="mt-1 text-xl font-bold text-foreground">{listing.propertyName}</p>
              <p className="text-sm text-muted-foreground">
                {listing.type} • {listing.location}
              </p>
            </div>
            <Badge tone="info" className="self-start sm:self-center">Read-only</Badge>
          </div>

          {/* Timeline Steps */}
          <div className="mt-8 space-y-1">
            {steps.map((stage, index) => {
              const log = findEntryForStage(stage);
              const statusLabel = log?.completedAt ? `Completed ${formatDate(log.completedAt)}` : "Pending";
              const isLast = index === steps.length - 1;
              const isCompleted = Boolean(log?.completedAt);
              const animationDelay = `${0.3 + index * 0.1}s`;
              const showBuyer = buyerDisplay && offerStageIndex >= 0 && index >= offerStageIndex;

              return (
                <div
                  key={stage}
                  className="timeline-step grid grid-cols-[auto,1fr] gap-4 animate-fade-in-up"
                  style={{ animationDelay }}
                >
                  {/* Timeline Indicator */}
                  <div className="relative flex flex-col items-center pt-1">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 ${isCompleted
                          ? "border-primary bg-primary/10 timeline-indicator-completed"
                          : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                        }`}
                    >
                      {isCompleted ? (
                        <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                      )}
                    </span>
                    {!isLast && (
                      <span
                        className={`absolute top-9 bottom-[-0.5rem] w-0.5 ${isCompleted ? "timeline-line" : "bg-slate-200 dark:bg-slate-800"
                          }`}
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  {/* Timeline Content Card */}
                  <div
                    className={`timeline-step-card mb-6 rounded-xl border px-5 py-4 transition-all duration-300 ${isCompleted
                      ? "border-primary/20 bg-gradient-to-br from-primary/5 to-transparent dark:from-primary/10"
                      : "border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40"
                      }`}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p
                          className={`text-sm font-semibold ${isCompleted ? "text-foreground" : "text-muted-foreground"}`}
                        >
                          {getProcessStageDisplayLabel(stage)}
                        </p>
                        {showBuyer ? (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Buyer: <span className="font-medium text-foreground">{buyerDisplay}</span>
                          </p>
                        ) : null}
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {log?.notes ?? "In progress"}
                        </p>
                      </div>
                      <Badge
                        tone={log?.completedAt ? "success" : "neutral"}
                        className={`self-start transition-all duration-300 sm:self-center ${isCompleted ? "shadow-sm" : ""
                          }`}
                      >
                        {statusLabel}
                      </Badge>
                    </div>

                    {/* Viewings List */}
                    {log?.viewings?.length ? (
                      <ul className="mt-4 space-y-2 border-t border-slate-200/50 pt-3 dark:border-slate-700/50">
                        {log.viewings.map((viewing) => (
                          <li
                            key={viewing.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-background/50 px-3 py-2 text-xs transition-colors hover:bg-background"
                          >
                            <span className="font-medium text-foreground">{viewing.name}</span>
                            <span className="text-muted-foreground">
                              {viewing.viewedAt ? viewing.viewedAt.toLocaleDateString("en-MY") : "Scheduled"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
