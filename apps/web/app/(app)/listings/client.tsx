/* eslint-disable jsx-a11y/label-has-associated-control */
"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ListingStatus, ProcessStage, generateOwnerViewToken } from "@leadlah/core";
import type { ListingInput, ProcessLogEntry } from "@leadlah/core";
import { reminders } from "@/lib/mock-data";
import { listingFormSchema, type ListingFormValues } from "@/lib/listings/form";
import { createListingAction, deleteListingAction, updateListingStatusAction } from "./actions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { updateProcessStage } from "@/lib/process-log/api";

type ProcessLogMap = Record<string, ProcessLogEntry[]>;

type ListingsClientProps = {
  initialListings: ListingInput[];
  initialProcessLogs: ProcessLogMap;
};

const emptyListing: ListingFormValues = {
  propertyName: "",
  type: "",
  price: 0,
  size: 0,
  bedrooms: 0,
  bathrooms: 0,
  location: "",
  status: ListingStatus.ACTIVE,
  photos: [],
  videos: [],
  documents: [],
  externalLinks: []
};

const stageOrder = Object.values(ProcessStage);
const sortProcessEntries = (entries: ProcessLogEntry[]) =>
  [...entries].sort((a, b) => stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage));

export default function ListingsClient({ initialListings, initialProcessLogs }: ListingsClientProps) {
  const [listings, setListings] = useState<ListingInput[]>(initialListings);
  const [processLogMap, setProcessLogMap] = useState<ProcessLogMap>(initialProcessLogs);
  const [form, setForm] = useState<ListingFormValues>(emptyListing);
  const [error, setError] = useState<string | null>(null);
  const [ownerLink, setOwnerLink] = useState<string | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setListings(initialListings);
  }, [initialListings]);

  useEffect(() => {
    setProcessLogMap(initialProcessLogs);
  }, [initialProcessLogs]);

  const statusTone = (status: ListingStatus) => {
    switch (status) {
      case ListingStatus.SOLD:
        return "success";
      case ListingStatus.RENTED:
        return "info";
      case ListingStatus.EXPIRED:
        return "warning";
      case ListingStatus.WITHDRAWN:
        return "danger";
      default:
        return "neutral";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = listingFormSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please review the listing details.");
      return;
    }
    startTransition(async () => {
      try {
        const created = await createListingAction(parsed.data);
        setListings((prev) => [created, ...prev]);
        setForm(() => ({ ...emptyListing }));
        setIsFormDialogOpen(false);
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "Unable to save this listing.");
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        const removed = await deleteListingAction(id);
        if (removed?.id) {
          setListings((prev) => prev.filter((listing) => listing.id !== removed.id));
        }
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "Unable to delete this listing.");
      }
    });
  };

  const handleStatusChange = (id: string, status: ListingStatus) => {
    startTransition(async () => {
      try {
        const updated = await updateListingStatusAction({ id, status });
        if (updated) {
          setListings((prev) => prev.map((listing) => (listing.id === updated.id ? updated : listing)));
        }
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "Unable to update the listing status.");
      }
    });
  };

  const handleProcessLogUpdate = (listingId: string, entry: ProcessLogEntry) => {
    setProcessLogMap((prev) => {
      const current = prev[listingId] ? [...prev[listingId]] : [];
      const idx = current.findIndex((item) => item.stage === entry.stage);
      if (idx >= 0) {
        current[idx] = entry;
      } else {
        current.push(entry);
      }
      return {
        ...prev,
        [listingId]: sortProcessEntries(current)
      };
    });
  };

  const ownerView = useMemo(() => generateOwnerViewToken(listings[0]?.id ?? crypto.randomUUID()), [listings]);
  const openListingForm = () => {
    setForm({ ...emptyListing });
    setError(null);
    setIsFormDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Listing Management</h1>
          <p className="text-sm text-slate-600">
            Centralized inventory with status workflow, media, external links, and owner-ready sharing.
          </p>
        </div>
        <Dialog
          open={isFormDialogOpen}
          onOpenChange={(open) => {
            setIsFormDialogOpen(open);
            if (!open) {
              setError(null);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button variant="secondary" size="sm" onClick={openListingForm}>
              New Listing
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create Listing</DialogTitle>
              <DialogDescription>Share-ready listings with media, external links, and workflow tracking.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Property Name</label>
                <Input
                  required
                  value={form.propertyName}
                  onChange={(e) => setForm({ ...form, propertyName: e.target.value })}
                  placeholder="e.g. Seri Maya Condo"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Type</label>
                <Input
                  required
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  placeholder="Condominium, Landed"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Price (RM)</label>
                <Input
                  required
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Size (sqft)</label>
                <Input
                  required
                  type="number"
                  value={form.size}
                  onChange={(e) => setForm({ ...form, size: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Bedrooms</label>
                <Input
                  required
                  type="number"
                  value={form.bedrooms}
                  onChange={(e) => setForm({ ...form, bedrooms: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Bathrooms</label>
                <Input
                  required
                  type="number"
                  value={form.bathrooms}
                  onChange={(e) => setForm({ ...form, bathrooms: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Location</label>
                <Input
                  required
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="City / State"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Status</label>
                <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value as ListingStatus })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ListingStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">External Portal Links</label>
                <Textarea
                  rows={3}
                  value={(form.externalLinks[0]?.url as string | undefined) ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      externalLinks: e.target.value
                        ? [{ provider: "Other", url: e.target.value }]
                        : []
                    })
                  }
                  placeholder="https://propertyguru.com/..."
                />
                <p className="text-xs text-slate-500">
                  Add portal URLs for quick reference. Expiry reminders auto-created from portal settings.
                </p>
              </div>
              <div className="md:col-span-2 flex items-center justify-between">
                <div className="text-sm text-red-600">{error}</div>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : "Save Listing"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Active Listings</h2>
          <Button variant="secondary" size="sm" onClick={() => setOwnerLink(ownerView.token)}>
            Generate Owner View Link
          </Button>
        </div>
        {ownerLink && (
          <p className="mt-2 text-xs text-slate-600">
            Shareable owner link: <code className="rounded bg-slate-100 px-2 py-1">{ownerLink}</code>
          </p>
        )}
        <div className="mt-4 divide-y divide-slate-100">
          {listings.map((listing) => {
            const logEntries = processLogMap[listing.id] ?? [];
            return (
              <div key={listing.id} className="grid gap-3 py-4 md:grid-cols-[1.5fr_auto_auto] md:items-center">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-semibold text-slate-900">{listing.propertyName}</h3>
                    <Badge tone={statusTone(listing.status)}>{listing.status}</Badge>
                  </div>
                  <p className="text-sm text-slate-600">
                    {listing.type} • {listing.bedrooms} bed / {listing.bathrooms} bath • {listing.size} sqft •{" "}
                    {listing.location}
                  </p>
                  <p className="text-sm font-semibold text-brand-700">RM {listing.price.toLocaleString()}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                    {listing.externalLinks.map((link) => (
                      <a key={link.url} href={link.url} className="underline" target="_blank" rel="noreferrer">
                        {link.provider} link
                      </a>
                    ))}
                  </div>
                </div>
                <ProcessLogDialog
                  listing={listing}
                  entries={logEntries}
                  onUpdated={(entry) => handleProcessLogUpdate(listing.id, entry)}
                />
                <div className="flex items-center gap-2 md:justify-end">
                  <Select
                    value={listing.status}
                    disabled={isPending}
                    onValueChange={(value) => handleStatusChange(listing.id, value as ListingStatus)}
                  >
                    <SelectTrigger className="max-w-[160px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ListingStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="danger" size="sm" disabled={isPending} onClick={() => handleDelete(listing.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900">Scheduler & Reminders</h2>
        <p className="text-sm text-slate-600">Portal expiry, exclusive appointment, follow-up, and tenancy renewal alerts.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {reminders.map((reminder) => (
            <div key={reminder.id} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{reminder.dueAt.toLocaleDateString()}</span>
                <Badge tone="warning">{reminder.type}</Badge>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-800">{reminder.message}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

type ProcessLogDialogProps = {
  listing: ListingInput;
  entries: ProcessLogEntry[];
  onUpdated: (entry: ProcessLogEntry) => void;
};

function ProcessLogDialog({ listing, entries, onUpdated }: ProcessLogDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<ProcessStage>(stageOrder[0]);
  const [notes, setNotes] = useState("");
  const [actor, setActor] = useState("");
  const [status, setStatus] = useState<"done" | "pending">("pending");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const completedCount = entries.filter((entry) => entry.completedAt).length;
  const pendingStage = useMemo(
    () => entries.find((entry) => !entry.completedAt)?.stage ?? stageOrder[0],
    [entries]
  );

  useEffect(() => {
    if (!open) {
      setMessage(null);
      return;
    }
    setSelectedStage(pendingStage);
  }, [open, pendingStage]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const current = entries.find((entry) => entry.stage === selectedStage);
    setNotes(current?.notes ?? "");
    setActor(current?.actor ?? "");
    setStatus(current?.completedAt ? "done" : "pending");
  }, [selectedStage, entries, open]);

  useEffect(() => {
    setMessage(null);
  }, [selectedStage]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const updated = await updateProcessStage(listing.id, {
        stage: selectedStage,
        notes: notes.trim() || undefined,
        actor: actor.trim() || undefined,
        completed: status === "done"
      });
      onUpdated(updated);
      setMessage({ tone: "success", text: `${selectedStage} updated.` });
    } catch (err) {
      setMessage({
        tone: "error",
        text: err instanceof Error ? err.message : "Unable to update this stage."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (value?: Date) => {
    if (!value) {
      return null;
    }
    return value.toLocaleDateString("en-MY", {
      day: "numeric",
      month: "short"
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex flex-col gap-1">
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            Process Log
          </Button>
        </DialogTrigger>
        <p className="text-xs text-slate-500">{completedCount} / {stageOrder.length} stages complete</p>
      </div>
      <DialogContent className="max-w-3xl overflow-hidden border-0 p-0">
        <div className="grid gap-0 md:grid-cols-[1.25fr_1fr]">
          <div className="space-y-4 bg-slate-50 p-6">
            <DialogHeader className="text-left">
              <DialogTitle>Process Timeline</DialogTitle>
              <DialogDescription>Live transparency for {listing.propertyName}</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {stageOrder.map((stage, index) => {
                const entry = entries.find((item) => item.stage === stage);
                const isComplete = Boolean(entry?.completedAt);
                return (
                  <div key={stage} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className={`h-2.5 w-2.5 rounded-full ${isComplete ? "bg-emerald-500" : "bg-slate-300"}`} />
                      {index < stageOrder.length - 1 && (
                        <span className={`mt-1 w-px flex-1 ${isComplete ? "bg-emerald-200" : "bg-slate-200"}`} />
                      )}
                    </div>
                    <div className="flex-1 rounded-xl border border-white/60 bg-white/80 p-3 shadow-sm shadow-slate-100">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-900">{stage}</p>
                        <Badge tone={isComplete ? "success" : "neutral"}>
                          {isComplete ? "Completed" : "Pending"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {entry?.notes ?? "No remarks yet. Keep owners in the loop."}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {entry?.actor ? `Handled by ${entry.actor}` : "Awaiting assignment"}
                        {entry?.completedAt ? ` • ${formatDate(entry.completedAt)}` : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="space-y-5 p-6">
            <DialogHeader className="text-left">
              <DialogTitle>Update Stage</DialogTitle>
              <DialogDescription>Sync buyers, owners, and teammates with one log.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-600">Stage</label>
                <Select value={selectedStage} onValueChange={(value) => setSelectedStage(value as ProcessStage)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Choose stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {stageOrder.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-600">Status</label>
                <Select value={status} onValueChange={(value) => setStatus(value as "done" | "pending")}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="done">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-medium text-slate-600">Actor</label>
                <Input
                  value={actor}
                  onChange={(e) => setActor(e.target.value)}
                  placeholder="Person in charge"
                  className="h-9"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-medium text-slate-600">Notes / Summary</label>
                <Textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. SPA drafted, LOI countersigned."
                />
              </div>
              {message && (
                <p className={`text-xs ${message.tone === "success" ? "text-emerald-600" : "text-red-600"}`}>
                  {message.text}
                </p>
              )}
              <Button onClick={handleSave} disabled={isSaving} className="w-full">
                {isSaving ? "Updating..." : "Save Stage Update"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
