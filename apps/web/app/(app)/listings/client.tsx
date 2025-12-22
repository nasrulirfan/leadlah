/* eslint-disable jsx-a11y/label-has-associated-control */
"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ListingCategory, ListingStatus, ProcessStage } from "@leadlah/core";
import type { ListingInput, ProcessLogEntry, ViewingCustomer } from "@leadlah/core";
import { reminders } from "@/lib/mock-data";
import { listingFormSchema, type ListingFormValues } from "@/lib/listings/form";
import { createListingAction, deleteListingAction, updateListingAction, updateListingCategoryAction, updateListingStatusAction } from "./actions";
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
import { fetchOwnerLink, updateProcessStage } from "@/lib/process-log/api";
import { encodeOwnerViewToken } from "@/lib/owner-link";
import { cn } from "@/lib/utils";
import { CheckCircle2, Copy, Trash2 } from "lucide-react";

type ProcessLogMap = Record<string, ProcessLogEntry[]>;

type ListingsClientProps = {
  initialListings: ListingInput[];
  initialProcessLogs: ProcessLogMap;
};

const emptyListing: ListingFormValues = {
  propertyName: "",
  type: "",
  category: ListingCategory.FOR_SALE,
  price: 0,
  size: 0,
  bedrooms: 0,
  bathrooms: 0,
  location: "",
  buildingProject: undefined,
  status: ListingStatus.ACTIVE,
  expiresAt: undefined,
  lastEnquiryAt: undefined,
  photos: [],
  videos: [],
  documents: [],
  externalLinks: []
};

const stageOrder = Object.values(ProcessStage);
const sortProcessEntries = (entries: ProcessLogEntry[]) =>
  [...entries].sort((a, b) => stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage));

const fallbackPropertyImages = [
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1430285561322-7808604715df?auto=format&fit=crop&w=600&q=80"
];

const coverImageFor = (listingId: string, photos: ListingInput["photos"]) => {
  if (photos[0]?.url) {
    return photos[0].url;
  }
  const index =
    listingId
      .split("")
      .map((char) => char.charCodeAt(0))
      .reduce((acc, code) => acc + code, 0) % fallbackPropertyImages.length;
  return fallbackPropertyImages[index];
};

const dateToInputValue = (value?: Date) => {
  if (!value) {
    return "";
  }
  return value.toISOString().slice(0, 10);
};

const listingToFormValues = (listing: ListingInput): ListingFormValues => ({
  propertyName: listing.propertyName,
  type: listing.type,
  category: listing.category,
  price: listing.price,
  size: listing.size,
  bedrooms: listing.bedrooms,
  bathrooms: listing.bathrooms,
  location: listing.location,
  buildingProject: listing.buildingProject,
  status: listing.status,
  expiresAt: listing.expiresAt ? dateToInputValue(listing.expiresAt) : undefined,
  lastEnquiryAt: listing.lastEnquiryAt ? dateToInputValue(listing.lastEnquiryAt) : undefined,
  photos: listing.photos ?? [],
  videos: listing.videos ?? [],
  documents: listing.documents ?? [],
  externalLinks: listing.externalLinks ?? []
});

export default function ListingsClient({ initialListings, initialProcessLogs }: ListingsClientProps) {
  const [listings, setListings] = useState<ListingInput[]>(initialListings);
  const [processLogMap, setProcessLogMap] = useState<ProcessLogMap>(initialProcessLogs);
  const [form, setForm] = useState<ListingFormValues>(emptyListing);
  const [error, setError] = useState<string | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<ListingInput | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<"All" | ListingCategory>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | ListingStatus>("All");
  const [locationFilter, setLocationFilter] = useState("");
  const [buildingProjectFilter, setBuildingProjectFilter] = useState("");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("");
  const [minPriceFilter, setMinPriceFilter] = useState("");
  const [maxPriceFilter, setMaxPriceFilter] = useState("");
  const [noEnquiryDaysFilter, setNoEnquiryDaysFilter] = useState("");
  const [expiringInDaysFilter, setExpiringInDaysFilter] = useState("");
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
        return "primary";
    }
  };

  const categoryTone = (category: ListingCategory) => {
    switch (category) {
      case ListingCategory.SOLD:
        return "success";
      case ListingCategory.RENTED:
        return "info";
      case ListingCategory.HOLD_FOR_SALE:
      case ListingCategory.BOOKED:
        return "warning";
      case ListingCategory.OFF_MARKET:
        return "neutral";
      default:
        return "primary";
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
        if (editingListing) {
          const updated = await updateListingAction(editingListing.id, parsed.data);
          if (updated) {
            setListings((prev) => prev.map((listing) => (listing.id === updated.id ? updated : listing)));
            setEditingListing(null);
          }
        } else {
          const created = await createListingAction(parsed.data);
          setListings((prev) => [created, ...prev]);
        }
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

  const handleCategoryChange = (id: string, category: ListingCategory) => {
    startTransition(async () => {
      try {
        const updated = await updateListingCategoryAction({ id, category });
        if (updated) {
          setListings((prev) => prev.map((listing) => (listing.id === updated.id ? updated : listing)));
        }
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "Unable to update the listing category.");
      }
    });
  };

  const filteredListings = useMemo(
    () => {
      const minPrice = minPriceFilter.trim() ? Number(minPriceFilter) : null;
      const maxPrice = maxPriceFilter.trim() ? Number(maxPriceFilter) : null;
      const noEnquiryDays = noEnquiryDaysFilter.trim() ? Number(noEnquiryDaysFilter) : null;
      const expiringInDays = expiringInDaysFilter.trim() ? Number(expiringInDaysFilter) : null;
      const now = new Date();

      return listings.filter((listing) => {
        if (categoryFilter !== "All" && listing.category !== categoryFilter) {
          return false;
        }
        if (statusFilter !== "All" && listing.status !== statusFilter) {
          return false;
        }
        if (locationFilter.trim() && !listing.location.toLowerCase().includes(locationFilter.trim().toLowerCase())) {
          return false;
        }
        if (propertyTypeFilter.trim() && !listing.type.toLowerCase().includes(propertyTypeFilter.trim().toLowerCase())) {
          return false;
        }
        if (buildingProjectFilter.trim()) {
          const haystack = `${listing.buildingProject ?? ""} ${listing.propertyName}`.toLowerCase();
          if (!haystack.includes(buildingProjectFilter.trim().toLowerCase())) {
            return false;
          }
        }
        if (minPrice != null && Number.isFinite(minPrice) && listing.price < minPrice) {
          return false;
        }
        if (maxPrice != null && Number.isFinite(maxPrice) && listing.price > maxPrice) {
          return false;
        }
        if (noEnquiryDays != null && Number.isFinite(noEnquiryDays)) {
          if (!listing.lastEnquiryAt) {
          } else {
            const threshold = new Date(now.getTime() - noEnquiryDays * 24 * 60 * 60 * 1000);
            if (listing.lastEnquiryAt >= threshold) {
              return false;
            }
          }
        }
        if (expiringInDays != null && Number.isFinite(expiringInDays)) {
          if (!listing.expiresAt) {
            return false;
          }
          const expiresBefore = new Date(now.getTime() + expiringInDays * 24 * 60 * 60 * 1000);
          if (listing.expiresAt < now || listing.expiresAt > expiresBefore) {
            return false;
          }
        }
        return true;
      });
    },
    [
      listings,
      categoryFilter,
      statusFilter,
      locationFilter,
      buildingProjectFilter,
      propertyTypeFilter,
      minPriceFilter,
      maxPriceFilter,
      noEnquiryDaysFilter,
      expiringInDaysFilter
    ]
  );

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

  const openListingForm = (listing?: ListingInput) => {
    if (listing) {
      setForm(listingToFormValues(listing));
      setEditingListing(listing);
    } else {
      setForm({ ...emptyListing });
      setEditingListing(null);
    }
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
              setEditingListing(null);
              setForm({ ...emptyListing });
            }
          }}
        >
          <DialogTrigger asChild>
            <Button variant="secondary" size="sm" onClick={() => openListingForm()}>
              New Listing
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editingListing ? "Edit Listing" : "Create Listing"}</DialogTitle>
              <DialogDescription>
                {editingListing ? "Update property details and share them instantly." : "Share-ready listings with media, external links, and workflow tracking."}
              </DialogDescription>
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
                <label className="text-sm font-semibold text-slate-700">Category</label>
                <Select
                  value={(form.category as ListingCategory | undefined) ?? ListingCategory.FOR_SALE}
                  onValueChange={(value) => setForm({ ...form, category: value as ListingCategory })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ListingCategory).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <label className="text-sm font-semibold text-slate-700">Building / Project</label>
                <Input
                  value={(form.buildingProject as string | undefined) ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      buildingProject: e.target.value.trim() ? e.target.value : undefined
                    })
                  }
                  placeholder="e.g. Mont Kiara, Serenia City"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Cover Photo URL</label>
                <Input
                  type="url"
                  value={form.photos[0]?.url ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      photos: e.target.value ? [{ url: e.target.value, label: "Cover photo" }] : []
                    })
                  }
                  placeholder="https://images.unsplash.com/..."
                />
                <p className="text-xs text-slate-500">Upload to your preferred storage and drop the public URL here.</p>
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
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Listing Expiry Date</label>
                <Input
                  type="date"
                  value={(form.expiresAt as string | undefined) ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      expiresAt: e.target.value ? e.target.value : undefined
                    })
                  }
                />
                <p className="text-xs text-slate-500">Used for expiring listing filters and reminders.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Last Enquiry Date</label>
                <Input
                  type="date"
                  value={(form.lastEnquiryAt as string | undefined) ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      lastEnquiryAt: e.target.value ? e.target.value : undefined
                    })
                  }
                />
                <p className="text-xs text-slate-500">Helps identify listings with no enquiry for X days.</p>
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
                  {isPending ? "Saving..." : editingListing ? "Update Listing" : "Save Listing"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Listings</h2>
            <p className="text-xs text-slate-500">
              Showing {filteredListings.length} of {listings.length} properties
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="Location"
              className="w-[160px]"
            />
            <Input
              value={buildingProjectFilter}
              onChange={(e) => setBuildingProjectFilter(e.target.value)}
              placeholder="Building / Project"
              className="w-[200px]"
            />
            <Input
              value={propertyTypeFilter}
              onChange={(e) => setPropertyTypeFilter(e.target.value)}
              placeholder="Property type"
              className="w-[160px]"
            />
            <Input
              type="number"
              value={minPriceFilter}
              onChange={(e) => setMinPriceFilter(e.target.value)}
              placeholder="Min price"
              className="w-[140px]"
            />
            <Input
              type="number"
              value={maxPriceFilter}
              onChange={(e) => setMaxPriceFilter(e.target.value)}
              placeholder="Max price"
              className="w-[140px]"
            />
            <Input
              type="number"
              value={noEnquiryDaysFilter}
              onChange={(e) => setNoEnquiryDaysFilter(e.target.value)}
              placeholder="No enquiry (days)"
              className="w-[160px]"
            />
            <Input
              type="number"
              value={expiringInDaysFilter}
              onChange={(e) => setExpiringInDaysFilter(e.target.value)}
              placeholder="Expiring in (days)"
              className="w-[160px]"
            />
            <Select
              value={categoryFilter}
              onValueChange={(value) => setCategoryFilter(value as "All" | ListingCategory)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {Object.values(ListingCategory).map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "All" | ListingStatus)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                {Object.values(ListingStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4 divide-y divide-slate-100">
          {filteredListings.map((listing) => {
            const logEntries = processLogMap[listing.id] ?? [];
            const coverImage = coverImageFor(listing.id, listing.photos);
            return (
              <div key={listing.id} className="grid gap-3 py-4 md:grid-cols-[2fr_auto_auto] md:items-center">
                <div className="flex gap-4">
                  <div className="h-28 w-36 overflow-hidden rounded-2xl bg-slate-100 shadow-inner">
                    <img src={coverImage} alt={listing.propertyName} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-semibold text-slate-900">{listing.propertyName}</h3>
                      <Badge tone={categoryTone(listing.category)}>{listing.category}</Badge>
                      <Badge tone={statusTone(listing.status)}>{listing.status}</Badge>
                    </div>
                    <p className="text-sm text-slate-600">
                      {listing.type} • {listing.bedrooms} bed / {listing.bathrooms} bath • {listing.size} sqft •{" "}
                      {listing.buildingProject ? `${listing.buildingProject} • ` : ""}
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
                </div>
                <ProcessLogDialog
                  listing={listing}
                  entries={logEntries}
                  onUpdated={(entry) => handleProcessLogUpdate(listing.id, entry)}
                />
                <div className="flex items-center gap-2 md:justify-end">
                  <Select
                    value={listing.category}
                    disabled={isPending}
                    onValueChange={(value) => handleCategoryChange(listing.id, value as ListingCategory)}
                  >
                    <SelectTrigger className="max-w-[180px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ListingCategory).map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Button variant="outline" size="sm" onClick={() => openListingForm(listing)}>
                    Edit
                  </Button>
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

type ViewingFormState = {
  name: string;
  phone: string;
  email: string;
  notes: string;
  viewedAt: string;
};

const emptyViewingForm: ViewingFormState = {
  name: "",
  phone: "",
  email: "",
  notes: "",
  viewedAt: ""
};

function ProcessLogDialog({ listing, entries, onUpdated }: ProcessLogDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<ProcessStage>(stageOrder[0]);
  const [notes, setNotes] = useState("");
  const [actor, setActor] = useState("");
  const [status, setStatus] = useState<"done" | "pending">("pending");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [viewings, setViewings] = useState<ViewingCustomer[]>([]);
  const [successfulBuyerId, setSuccessfulBuyerId] = useState<string | null>(null);
  const [viewingForm, setViewingForm] = useState<ViewingFormState>(emptyViewingForm);
  const [viewingError, setViewingError] = useState<string | null>(null);
  const [isViewingsDialogOpen, setIsViewingsDialogOpen] = useState(false);
  const [ownerShareLink, setOwnerShareLink] = useState<string | null>(null);
  const [ownerShareExpiresAt, setOwnerShareExpiresAt] = useState<Date | null>(null);
  const [ownerLinkError, setOwnerLinkError] = useState<string | null>(null);
  const [isGeneratingOwnerLink, setIsGeneratingOwnerLink] = useState(false);
  const [hasCopiedOwnerLink, setHasCopiedOwnerLink] = useState(false);

  const generateViewingId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const completedCount = entries.filter((entry) => entry.completedAt).length;
  const pendingStage = useMemo(
    () => entries.find((entry) => !entry.completedAt)?.stage ?? stageOrder[0],
    [entries]
  );
  const isViewingStage = selectedStage === ProcessStage.VIEWING_RECORD;

  const handleViewingInputChange = (field: keyof ViewingFormState, value: string) => {
    setViewingForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddViewing = () => {
    if (!viewingForm.name.trim()) {
      setViewingError("Customer name is required.");
      return;
    }

    const record: ViewingCustomer = {
      id: generateViewingId(),
      name: viewingForm.name.trim(),
      phone: viewingForm.phone.trim() || undefined,
      email: viewingForm.email.trim() || undefined,
      notes: viewingForm.notes.trim() || undefined,
      viewedAt: viewingForm.viewedAt ? new Date(viewingForm.viewedAt) : undefined
    };

    setViewings((prev) => [...prev, record]);
    setViewingForm(emptyViewingForm);
    setViewingError(null);
  };

  const handleRemoveViewing = (id: string) => {
    setViewings((prev) => prev.filter((viewing) => viewing.id !== id));
    if (successfulBuyerId === id) {
      setSuccessfulBuyerId(null);
    }
  };

  const handleSelectBuyer = (id: string) => {
    setSuccessfulBuyerId((prev) => (prev === id ? null : id));
    setStatus("done");
  };

  const viewingDateLabel = (date?: Date) => {
    if (!date) {
      return "Viewing scheduled";
    }
    return date.toLocaleString("en-MY", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  };

  const handleGenerateOwnerLink = async () => {
    setOwnerLinkError(null);
    setHasCopiedOwnerLink(false);
    setIsGeneratingOwnerLink(true);
    try {
      const token = await fetchOwnerLink(listing.id);
      const encoded = encodeOwnerViewToken(token);
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
        (typeof window !== "undefined" ? window.location.origin : "");
      const url = `${baseUrl || ""}/owner/${encoded}`;
      setOwnerShareLink(url);
      setOwnerShareExpiresAt(token.expiresAt);
    } catch (err) {
      setOwnerLinkError(err instanceof Error ? err.message : "Unable to generate owner link.");
      setOwnerShareLink(null);
      setOwnerShareExpiresAt(null);
    } finally {
      setIsGeneratingOwnerLink(false);
    }
  };

  const handleCopyOwnerLink = async () => {
    if (!ownerShareLink || typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      return;
    }
    try {
      await navigator.clipboard.writeText(ownerShareLink);
      setHasCopiedOwnerLink(true);
    } catch (err) {
      setOwnerLinkError(err instanceof Error ? err.message : "Unable to copy link. Copy manually.");
    }
  };

  useEffect(() => {
    if (!open) {
      setMessage(null);
      setViewingError(null);
      setViewingForm(emptyViewingForm);
      setViewings([]);
      setSuccessfulBuyerId(null);
      setOwnerShareLink(null);
      setOwnerShareExpiresAt(null);
      setOwnerLinkError(null);
      setHasCopiedOwnerLink(false);
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
    if (selectedStage === ProcessStage.VIEWING_RECORD) {
      setViewings(current?.viewings ?? []);
      setSuccessfulBuyerId(current?.successfulBuyerId ?? null);
    }
    setViewingForm(emptyViewingForm);
  }, [selectedStage, entries, open]);

  useEffect(() => {
    setMessage(null);
    setViewingError(null);
  }, [selectedStage]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    if (isViewingStage) {
      if (viewings.length === 0) {
        setViewingError("Add at least one viewing before saving this stage.");
        setIsSaving(false);
        return;
      }
      if (successfulBuyerId && !viewings.some((viewing) => viewing.id === successfulBuyerId)) {
        setViewingError("Selected buyer must be part of the viewing list.");
        setIsSaving(false);
        return;
      }
    }
    try {
      const payload = {
        stage: selectedStage,
        notes: notes.trim() || undefined,
        actor: actor.trim() || undefined,
        completed: status === "done",
        viewings: isViewingStage ? viewings : undefined,
        successfulBuyerId: isViewingStage ? successfulBuyerId ?? undefined : undefined
      };
      const updated = await updateProcessStage(listing.id, payload);
      onUpdated(updated);
      setMessage({ tone: "success", text: `${selectedStage} updated.` });
      if (!isViewingStage) {
        setViewingError(null);
      }
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

  const formatDateTime = (value?: Date | null) => {
    if (!value) {
      return null;
    }
    return value.toLocaleString("en-MY", {
      dateStyle: "medium",
      timeStyle: "short"
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
        <p className="text-xs text-muted-foreground">
          {completedCount} / {stageOrder.length} stages complete
        </p>
      </div>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto border-0 p-0">
        <div className="grid gap-0 md:grid-cols-[1.25fr_1fr]">
          <div className="space-y-4 bg-slate-50 p-6 dark:bg-slate-900/30">
            <DialogHeader className="text-left">
              <DialogTitle>Process Timeline</DialogTitle>
              <DialogDescription>Live transparency for {listing.propertyName}</DialogDescription>
            </DialogHeader>
            <div className="rounded-xl border border-dashed border-slate-300/70 bg-white/80 p-4 text-sm shadow-sm dark:border-slate-700/80 dark:bg-slate-900/60">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Owner access</p>
                  <p className="text-sm text-muted-foreground">Share a read-only link for this listing.</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleGenerateOwnerLink}
                  disabled={isGeneratingOwnerLink}
                >
                  {isGeneratingOwnerLink ? "Generating..." : "Generate link"}
                </Button>
              </div>
              {ownerLinkError ? <p className="mt-2 text-xs text-destructive">{ownerLinkError}</p> : null}
              {ownerShareLink ? (
                <div className="mt-3 space-y-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
                    <code className="flex-1 rounded-lg border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 break-all">
                      {ownerShareLink}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={handleCopyOwnerLink}
                    >
                      {hasCopiedOwnerLink ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      {hasCopiedOwnerLink ? "Copied" : "Copy link"}
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {hasCopiedOwnerLink ? "Link copied" : `Expires ${formatDateTime(ownerShareExpiresAt) ?? ""}`}
                  </p>
                </div>
              ) : null}
            </div>
            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {stageOrder.map((stage, index) => {
                const entry = entries.find((item) => item.stage === stage);
                const isComplete = Boolean(entry?.completedAt);
                const isActiveStage = selectedStage === stage;
                return (
                  <div key={stage} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${isComplete ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"}`}
                      />
                      {index < stageOrder.length - 1 && (
                        <span
                          className={`mt-1 w-px flex-1 ${isComplete ? "bg-emerald-200" : "bg-slate-200 dark:bg-slate-800"}`}
                        />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedStage(stage)}
                      className={cn(
                        "flex-1 rounded-xl border border-border/50 bg-card/90 p-3 text-left shadow-sm shadow-slate-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-slate-800/80 dark:bg-slate-900/60",
                        isActiveStage && "border-primary/40 ring-2 ring-primary/20"
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">{stage}</p>
                        <Badge tone={isComplete ? "success" : "neutral"}>
                          {isComplete ? "Completed" : "Pending"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {entry?.notes ?? "No remarks yet. Keep owners in the loop."}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground/80">
                        {entry?.actor ? `Handled by ${entry.actor}` : "Awaiting assignment"}
                        {entry?.completedAt ? ` • ${formatDate(entry.completedAt)}` : ""}
                      </p>
                      {stage === ProcessStage.VIEWING_RECORD && entry?.viewings?.length ? (
                        <div className="mt-3 space-y-2">
                          {entry.viewings.map((viewing) => {
                            const contact = [viewing.phone, viewing.email].filter(Boolean).join(" • ");
                            const isBuyer = entry.successfulBuyerId === viewing.id;
                            return (
                              <div
                                key={viewing.id}
                                className="rounded-lg border border-border/70 bg-background/70 p-3 text-xs dark:border-slate-800/60 dark:bg-slate-900/60"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">{viewing.name}</p>
                                    <p className="text-xs text-muted-foreground">{contact || "Contact pending"}</p>
                                    <p className="text-[11px] text-muted-foreground/80">{viewingDateLabel(viewing.viewedAt)}</p>
                                  </div>
                                  <Badge tone={isBuyer ? "success" : "info"} className="text-[11px]">
                                    {isBuyer ? "Successful buyer" : "Viewing"}
                                  </Badge>
                                </div>
                                {viewing.notes && (
                                  <p className="mt-2 text-xs text-muted-foreground">{viewing.notes}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </button>
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
              {isViewingStage && (
                <div className="space-y-3 rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4 dark:bg-slate-900/40">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Viewing Records</p>
                      <p className="text-xs text-muted-foreground">Log prospects and select the successful buyer.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {viewings.length > 0 && (
                        <Button type="button" variant="outline" size="sm" onClick={() => setIsViewingsDialogOpen(true)}>
                          View list
                        </Button>
                      )}
                      {successfulBuyerId && (
                        <Badge tone="success" className="text-xs">
                          Buyer appointed
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <label htmlFor="viewingName" className="text-xs font-medium text-muted-foreground">
                        Customer Name
                      </label>
                      <Input
                        id="viewingName"
                        value={viewingForm.name}
                        onChange={(event) => handleViewingInputChange("name", event.target.value)}
                        placeholder="e.g. Tan Family"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="viewingPhone" className="text-xs font-medium text-muted-foreground">
                        Phone
                      </label>
                      <Input
                        id="viewingPhone"
                        value={viewingForm.phone}
                        onChange={(event) => handleViewingInputChange("phone", event.target.value)}
                        placeholder="+60 ..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="viewingEmail" className="text-xs font-medium text-muted-foreground">
                        Email (optional)
                      </label>
                      <Input
                        id="viewingEmail"
                        value={viewingForm.email}
                        onChange={(event) => handleViewingInputChange("email", event.target.value)}
                        placeholder="customer@email.com"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="viewingDate" className="text-xs font-medium text-muted-foreground">
                        Viewing Date
                      </label>
                      <Input
                        id="viewingDate"
                        type="datetime-local"
                        value={viewingForm.viewedAt}
                        onChange={(event) => handleViewingInputChange("viewedAt", event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="viewingNotes" className="text-xs font-medium text-muted-foreground">
                      Notes
                    </label>
                    <Textarea
                      id="viewingNotes"
                      rows={2}
                      value={viewingForm.notes}
                      onChange={(event) => handleViewingInputChange("notes", event.target.value)}
                      placeholder="Interest level, objections, follow-up plan"
                    />
                  </div>
                  {viewingError && <p className="text-xs text-red-600">{viewingError}</p>}
                  <div className="flex items-center justify-end">
                    <Button type="button" variant="secondary" size="sm" onClick={handleAddViewing}>
                      Add Viewing
                    </Button>
                  </div>
                </div>
              )}
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
      {isViewingStage && (
        <Dialog open={isViewingsDialogOpen} onOpenChange={setIsViewingsDialogOpen}>
          <DialogContent className="max-w-2xl space-y-4">
            <DialogHeader>
              <DialogTitle>Viewings for {listing.propertyName}</DialogTitle>
              <DialogDescription>Review all prospects and appoint the successful buyer.</DialogDescription>
            </DialogHeader>
            {viewings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No viewings recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {viewings.map((viewing) => {
                  const contact = [viewing.phone, viewing.email].filter(Boolean).join(" • ");
                  const isBuyer = successfulBuyerId === viewing.id;
                  return (
                    <div
                      key={viewing.id}
                      className="rounded-2xl border border-border/80 bg-muted/30 p-4 dark:border-slate-800 dark:bg-slate-900/60"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-foreground">{viewing.name}</p>
                          <p className="text-sm text-muted-foreground">{contact || "Contact pending"}</p>
                          <p className="text-xs text-muted-foreground/80">{viewingDateLabel(viewing.viewedAt)}</p>
                          {viewing.notes && <p className="mt-2 text-sm text-muted-foreground">{viewing.notes}</p>}
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={isBuyer ? "default" : "outline"}
                            onClick={() => handleSelectBuyer(viewing.id)}
                          >
                            {isBuyer ? (
                              <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Buyer
                              </>
                            ) : (
                              "Mark Buyer"
                            )}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveViewing(viewing.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex justify-end">
              <Button type="button" variant="secondary" onClick={() => setIsViewingsDialogOpen(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
