/* eslint-disable jsx-a11y/label-has-associated-control */
"use client";

import { useMemo, useState } from "react";
import { listingSchema, ListingStatus, generateOwnerViewToken } from "@leadlah/core";
import type { ListingInput } from "@leadlah/core";
import { listings as seedListings, processLogs, reminders } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

type ListingForm = Omit<ListingInput, "id" | "createdAt" | "updatedAt">;

const emptyListing: ListingForm = {
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

export default function ListingsClient() {
  const [listings, setListings] = useState(seedListings);
  const [form, setForm] = useState<ListingForm>(emptyListing);
  const [error, setError] = useState<string | null>(null);
  const [ownerLink, setOwnerLink] = useState<string | null>(null);

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
    const parsed = listingSchema.safeParse({
      id: crypto.randomUUID(),
      ...form,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    if (!parsed.success) {
      setError(parsed.error.errors[0].message);
      return;
    }
    setListings([parsed.data, ...listings]);
    setForm(emptyListing);
  };

  const handleDelete = (id: string) => {
    setListings(listings.filter((l) => l.id !== id));
  };

  const ownerView = useMemo(() => generateOwnerViewToken(listings[0]?.id ?? crypto.randomUUID()), [listings]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Listing Management</h1>
          <p className="text-sm text-slate-600">
            Centralized inventory with status workflow, media, external links, and owner-ready sharing.
          </p>
        </div>
        <Button asChild variant="secondary" size="sm">
          <a href="#create">New Listing</a>
        </Button>
      </div>

      <Card id="create">
        <h2 className="text-lg font-semibold text-slate-900">Create / Update Listing</h2>
        <form onSubmit={handleSubmit} className="mt-4 grid gap-4 md:grid-cols-3">
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
              rows={2}
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
          <div className="md:col-span-3 flex items-center justify-between">
            <div className="text-sm text-red-600">{error}</div>
            <Button type="submit">Save Listing</Button>
          </div>
        </form>
      </Card>

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
          {listings.map((listing) => (
            <div key={listing.id} className="grid gap-3 py-4 md:grid-cols-[1.5fr_1fr_1fr] md:items-center">
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
              <div className="space-y-1 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                <p className="font-semibold text-slate-800">Process Log</p>
                {(processLogs[listing.id] ?? []).map((log, index) => (
                  <p key={index}>
                    {log.stage} {log.completedAt ? "✓" : ""} {log.actor ? `• ${log.actor}` : ""}
                  </p>
                ))}
              </div>
              <div className="flex items-center gap-2 md:justify-end">
                <Select
                  value={listing.status}
                  onValueChange={(value) =>
                    setListings((prev) =>
                      prev.map((item) =>
                        item.id === listing.id
                          ? { ...item, status: value as ListingStatus, updatedAt: new Date() }
                          : item
                      )
                    )
                  }
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
                <Button variant="danger" size="sm" onClick={() => handleDelete(listing.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
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
