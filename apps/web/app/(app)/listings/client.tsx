/* eslint-disable jsx-a11y/label-has-associated-control */
"use client";

import { forwardRef, useEffect, useMemo, useState, useTransition } from "react";
import {
  calculateListingGrading,
  ListingCategory,
  ListingStatus,
  ProcessStage,
  type ListingGradingResult,
} from "@leadlah/core";
import type {
  ListingInput,
  ProcessLogEntry,
  ViewingCustomer,
} from "@leadlah/core";
import { listingFormSchema, type ListingFormValues } from "@/lib/listings/form";
import {
  formatMalaysiaLocation,
  malaysiaDistrictsForState,
  MALAYSIA_STATES,
  type MalaysiaState,
} from "@/lib/malaysia/locations";
import {
  createListingAction,
  deleteListingAction,
  ingestListingPhotosAction,
  updateListingAction,
  updateListingCategoryAction,
  updateListingStatusAction,
} from "./actions";
import { ListingPhotosField } from "./ListingPhotosField";
import { stageListingPhotos } from "./photo-upload";
import { ListingReminderDialog } from "./ListingReminderDialog";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { DatePicker } from "@/components/ui/date-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { fetchOwnerLink, updateProcessStage } from "@/lib/process-log/api";
import { encodeOwnerViewToken } from "@/lib/owner-link";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Copy,
  Trash2,
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Building2,
  MapPin,
  Bed,
  Bath,
  Maximize,
  ExternalLink,
  MoreHorizontal,
  Edit3,
  Bell,
  Clock,
  TrendingUp,
  Eye,
  X,
  Sparkles,
  Home,
  Calendar,
} from "lucide-react";

type ProcessLogMap = Record<string, ProcessLogEntry[]>;

type ListingsClientProps = {
  userId: string;
  initialListings: ListingInput[];
  initialProcessLogs: ProcessLogMap;
};

const emptyListing: ListingFormValues = {
  propertyName: "",
  lotUnitNo: undefined,
  type: "",
  category: ListingCategory.FOR_SALE,
  price: 0,
  bankValue: undefined,
  competitorPriceRange: undefined,
  size: 0,
  bedrooms: 0,
  bathrooms: 0,
  location: "",
  state: undefined,
  district: undefined,
  buildingProject: undefined,
  status: ListingStatus.ACTIVE,
  expiresAt: undefined,
  lastEnquiryAt: undefined,
  photos: [],
  videos: [],
  documents: [],
  externalLinks: [],
};

const propertyTypeOptions = [
  "Condominium",
  "Serviced Apartment",
  "Apartment",
  "Landed",
  "Townhouse",
  "Semi-D",
  "Bungalow",
  "Land",
  "Shop Lot",
  "Office",
  "Retail",
  "Warehouse",
  "Other",
];

const FieldLabel = ({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) => (
  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
    {children}
    {required ? <span className="ml-0.5 text-red-500">*</span> : null}
  </label>
);

const formatRinggit = (value: number) => `RM ${Math.round(value).toLocaleString()}`;

const formatSignedPct = (value: number) => {
  const rounded = Math.round(value * 10) / 10;
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded}%`;
};

function gradeTone(grade: ListingGradingResult["grade"]) {
  switch (grade) {
    case "A":
      return "success";
    case "B":
      return "primary";
    case "C":
      return "warning";
    case "D":
      return "danger";
    default:
      return "neutral";
  }
}

function gradeColorClasses(grade: ListingGradingResult["grade"]) {
  switch (grade) {
    case "A":
      return "border-emerald-600 bg-emerald-600 text-white";
    case "B":
      return "border-blue-600 bg-blue-600 text-white";
    case "C":
      return "border-amber-600 bg-amber-600 text-white";
    case "D":
      return "border-red-600 bg-red-600 text-white";
    default:
      return "border-slate-600 bg-slate-600 text-white";
  }
}

function marketPositionCopy(value: number) {
  if (value <= 30) return "Low (competitive)";
  if (value <= 60) return "Mid-market";
  if (value <= 85) return "High";
  return "Very high";
}

function bankGapCopy(value: number) {
  if (value < 0) return "Discount vs bank value";
  if (value <= 5) return "Aligned to bank value";
  if (value <= 10) return "Slight premium";
  if (value <= 20) return "High premium";
  return "Very high premium";
}

function ListingGradeBadge({
  askingPrice,
  grading,
}: {
  askingPrice: number;
  grading: ListingGradingResult;
}) {
  const title = grading.grade
    ? `${grading.grade} · ${grading.label}`
    : grading.missingInputs.length > 0
      ? "Grade · Needs data"
      : "Grade · Unavailable";

  const missingCopy =
    grading.missingInputs.length === 0
      ? null
      : grading.missingInputs
          .map((key) =>
            key === "bankValue"
              ? "Bank value"
              : key === "competitorMinPrice" || key === "competitorMaxPrice"
                ? "Competitor range"
                : key,
          )
          .filter((v, i, arr) => arr.indexOf(v) === i)
          .join(", ");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="focus:outline-none">
          <Badge
            className={cn(
              "gap-1.5 border-2 shadow-lg backdrop-blur-md hover:scale-105 transition-all",
              grading.grade 
                ? gradeColorClasses(grading.grade)
                : "border-slate-600 bg-slate-600 text-white"
            )}
          >
            <Sparkles className="h-3 w-3" />
            <span className="font-semibold tabular-nums">
              {grading.grade ? `${grading.grade} · ${grading.label}` : "Grade"}
            </span>
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">
              Asking price: <span className="font-medium">{formatRinggit(askingPrice)}</span>
            </p>
          </div>
          {grading.grade ? (
            <Badge tone={gradeTone(grading.grade)} className="px-2 py-1">
              {grading.grade}
            </Badge>
          ) : null}
        </div>

        {missingCopy ? (
          <div className="mt-3 rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Add <span className="font-medium text-foreground">{missingCopy}</span> to score this
            listing.
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Market position</span>
              <span className="font-medium text-foreground tabular-nums">
                {grading.marketPositionPct == null
                  ? "—"
                  : `${Math.round(grading.marketPositionPct)}%`}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500"
                style={{
                  width:
                    grading.marketPositionPct == null
                      ? "0%"
                      : `${Math.round(grading.marketPositionPct)}%`,
                }}
              />
            </div>
            {grading.marketPositionPct != null ? (
              <p className="text-[11px] text-muted-foreground">
                {marketPositionCopy(grading.marketPositionPct)}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Bank value gap</span>
              <span className="font-medium text-foreground tabular-nums">
                {grading.bankValueGapPct == null ? "—" : formatSignedPct(grading.bankValueGapPct)}
              </span>
            </div>
            {grading.bankValueGapPct != null ? (
              <p className="text-[11px] text-muted-foreground">{bankGapCopy(grading.bankValueGapPct)}</p>
            ) : null}
          </div>

          {(grading.competitorMinPrice != null || grading.competitorMaxPrice != null) && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border bg-muted/30 px-3 py-2">
                <p className="text-[11px] text-muted-foreground">Competitor min</p>
                <p className="font-medium text-foreground tabular-nums">
                  {grading.competitorMinPrice == null
                    ? "—"
                    : formatRinggit(grading.competitorMinPrice)}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 px-3 py-2">
                <p className="text-[11px] text-muted-foreground">Competitor max</p>
                <p className="font-medium text-foreground tabular-nums">
                  {grading.competitorMaxPrice == null
                    ? "—"
                    : formatRinggit(grading.competitorMaxPrice)}
                </p>
              </div>
            </div>
          )}
        </div>

        {grading.notes.length > 0 ? (
          <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
            {grading.notes.slice(0, 2).map((note, idx) => (
              <p key={idx}>• {note}</p>
            ))}
          </div>
        ) : null}

        <div className="mt-3 border-t pt-3 text-[11px] text-muted-foreground">
          Higher grades favor <span className="font-medium text-foreground">lower market position</span>{" "}
          and <span className="font-medium text-foreground">close bank value alignment</span>.
        </div>
      </PopoverContent>
    </Popover>
  );
}

const stageOrder = Object.values(ProcessStage);
const sortProcessEntries = (entries: ProcessLogEntry[]) =>
  [...entries].sort(
    (a, b) => stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage),
  );

const fallbackPropertyImages = [
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1430285561322-7808604715df?auto=format&fit=crop&w=600&q=80",
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const keyToUrl = (key: string) =>
  `${API_BASE_URL.replace(/\/$/, "")}/media/r2?key=${encodeURIComponent(key)}`;

const coverSourcesFor = (listingId: string, photos: ListingInput["photos"]) => {
  const first = photos?.[0];
  if (first) {
    if (
      "variants" in first &&
      "status" in first &&
      (first as any).status === "READY" &&
      Array.isArray((first as any).variants)
    ) {
      const variants = (first as any).variants as {
        kind: string;
        format: string;
        width: number;
        key: string;
      }[];

      const responsiveAvif = variants
        .filter((v) => v.kind === "RESPONSIVE" && v.format === "avif")
        .sort((a, b) => a.width - b.width)
        .map((v) => `${keyToUrl(v.key)} ${v.width}w`)
        .join(", ");

      const responsiveWebp = variants
        .filter((v) => v.kind === "RESPONSIVE" && v.format === "webp")
        .sort((a, b) => a.width - b.width)
        .map((v) => `${keyToUrl(v.key)} ${v.width}w`)
        .join(", ");

      const fallback =
        variants
          .filter((v) => v.kind === "RESPONSIVE" && v.format === "webp")
          .sort((a, b) => b.width - a.width)[0]?.key ??
        variants
          .filter((v) => v.kind === "RESPONSIVE" && v.format === "avif")
          .sort((a, b) => b.width - a.width)[0]?.key ??
        null;

      if (fallback) {
        return {
          fallbackUrl: keyToUrl(fallback),
          avifSrcSet: responsiveAvif || undefined,
          webpSrcSet: responsiveWebp || undefined,
        };
      }
    }
    if ("url" in first && typeof (first as any).url === "string") {
      return { fallbackUrl: (first as any).url as string };
    }
  }
  const index =
    listingId
      .split("")
      .map((char) => char.charCodeAt(0))
      .reduce((acc, code) => acc + code, 0) % fallbackPropertyImages.length;
  return { fallbackUrl: fallbackPropertyImages[index]! };
};

const dateToInputValue = (value?: Date) => {
  if (!value) {
    return "";
  }
  return value.toISOString().slice(0, 10);
};

const selectAllIfZero = (event: React.FocusEvent<HTMLInputElement>) => {
  if (event.currentTarget.value === "0") {
    event.currentTarget.select();
  }
};

const keepSelectionOnMouseUpIfZero = (
  event: React.MouseEvent<HTMLInputElement>,
) => {
  if (event.currentTarget.value === "0") {
    event.preventDefault();
  }
};

const parseOptionalNumber = (value: string) => {
  if (!value.trim()) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const listingToFormValues = (listing: ListingInput): ListingFormValues => ({
  propertyName: listing.propertyName,
  lotUnitNo: listing.lotUnitNo,
  type: listing.type,
  category: listing.category,
  price: listing.price,
  bankValue: listing.bankValue,
  competitorPriceRange: listing.competitorPriceRange,
  size: listing.size,
  bedrooms: listing.bedrooms,
  bathrooms: listing.bathrooms,
  location: listing.location,
  buildingProject: listing.buildingProject,
  status: listing.status,
  expiresAt: listing.expiresAt
    ? dateToInputValue(listing.expiresAt)
    : undefined,
  lastEnquiryAt: listing.lastEnquiryAt
    ? dateToInputValue(listing.lastEnquiryAt)
    : undefined,
  photos: listing.photos ?? [],
  videos: listing.videos ?? [],
  documents: listing.documents ?? [],
  externalLinks:
    listing.externalLinks?.map((link) => ({
      ...link,
      expiresAt: link.expiresAt ? dateToInputValue(link.expiresAt) : undefined,
    })) ?? [],
});

const formatPrice = (price: number) => {
  if (price >= 1000000) {
    return `RM ${(price / 1000000).toFixed(price % 1000000 === 0 ? 0 : 1)}M`;
  }
  if (price >= 1000) {
    return `RM ${(price / 1000).toFixed(0)}K`;
  }
  return `RM ${price.toLocaleString()}`;
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

const filterChipVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

// Status and category styling
const statusConfig: Record<
  ListingStatus,
  { color: string; bg: string; icon: React.ReactNode }
> = {
  [ListingStatus.ACTIVE]: {
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
    icon: <TrendingUp className="h-3 w-3" />,
  },
  [ListingStatus.SOLD]: {
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  [ListingStatus.RENTED]: {
    color: "text-violet-700 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20",
    icon: <Home className="h-3 w-3" />,
  },
  [ListingStatus.EXPIRED]: {
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20",
    icon: <Clock className="h-3 w-3" />,
  },
  [ListingStatus.WITHDRAWN]: {
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-100 dark:bg-slate-500/10 border-slate-200 dark:border-slate-500/20",
    icon: <X className="h-3 w-3" />,
  },
};

const categoryConfig: Record<ListingCategory, { color: string; bg: string }> = {
  [ListingCategory.FOR_SALE]: {
    color: "text-rose-700 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20",
  },
  [ListingCategory.FOR_RENT]: {
    color: "text-sky-700 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20",
  },
  [ListingCategory.FOR_SALE_AND_RENT]: {
    color: "text-indigo-700 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20",
  },
  [ListingCategory.SOLD]: {
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
  },
  [ListingCategory.RENTED]: {
    color: "text-violet-700 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20",
  },
  [ListingCategory.HOLD_FOR_SALE]: {
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20",
  },
  [ListingCategory.BOOKED]: {
    color: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20",
  },
  [ListingCategory.OFF_MARKET]: {
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-100 dark:bg-slate-500/10 border-slate-200 dark:border-slate-500/20",
  },
};

// Quick Stats Component
function QuickStats({ listings }: { listings: ListingInput[] }) {
  const stats = useMemo(() => {
    const active = listings.filter(
      (l) => l.status === ListingStatus.ACTIVE,
    ).length;
    const sold = listings.filter(
      (l) => l.category === ListingCategory.SOLD,
    ).length;
    const rented = listings.filter(
      (l) => l.category === ListingCategory.RENTED,
    ).length;
    const totalValue = listings.reduce((sum, l) => sum + l.price, 0);
    return { active, sold, rented, totalValue };
  }, [listings]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        {
          label: "Active",
          value: stats.active,
          icon: TrendingUp,
          color: "text-emerald-600",
        },
        {
          label: "Sold",
          value: stats.sold,
          icon: CheckCircle2,
          color: "text-blue-600",
        },
        {
          label: "Rented",
          value: stats.rented,
          icon: Home,
          color: "text-violet-600",
        },
        {
          label: "Portfolio",
          value: formatPrice(stats.totalValue),
          icon: Sparkles,
          color: "text-amber-600",
        },
      ].map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-white to-slate-50/50 p-4 shadow-sm transition-all hover:shadow-md dark:from-slate-900 dark:to-slate-800/50"
        >
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br from-primary/5 to-transparent" />
          <stat.icon className={cn("h-5 w-5 mb-2", stat.color)} />
          <p className="text-2xl font-bold text-foreground">{stat.value}</p>
          <p className="text-xs text-muted-foreground">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
}

// Filter Chip Component
function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <motion.span
      variants={filterChipVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
    >
      {label}
      <button
        onClick={onRemove}
        className="rounded-full p-0.5 hover:bg-primary/20 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </motion.span>
  );
}

// Listing Card Component
type ListingCardProps = {
  userId: string;
  listing: ListingInput;
  logEntries: ProcessLogEntry[];
  isPending: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: ListingStatus) => void;
  onCategoryChange: (category: ListingCategory) => void;
  onProcessLogUpdate: (entry: ProcessLogEntry) => void;
};

const ListingCard = forwardRef<HTMLDivElement, ListingCardProps>(function ListingCard(
  props,
  ref,
) {
  const {
    userId,
    listing,
    logEntries,
    isPending,
    onEdit,
    onDelete,
    onStatusChange,
    onCategoryChange,
    onProcessLogUpdate,
  } = props;
  const [showActions, setShowActions] = useState(false);
  const cover = coverSourcesFor(listing.id, listing.photos);
  const completedStages = logEntries.filter((e) => e.completedAt).length;
  const progress = (completedStages / stageOrder.length) * 100;
  const statusStyle = statusConfig[listing.status];
  const categoryStyle = categoryConfig[listing.category];
  const grading = useMemo(
    () =>
      calculateListingGrading({
        askingPrice: listing.price,
        bankValue: listing.bankValue,
        competitorPriceRangeText: listing.competitorPriceRange,
      }),
    [listing.price, listing.bankValue, listing.competitorPriceRange],
  );

  return (
    <motion.div
      ref={ref}
      variants={cardVariants}
      layout
      className="group relative overflow-hidden rounded-3xl border border-border/40 bg-card shadow-sm transition-all duration-300 hover:border-border hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50"
    >
      {/* Image Section */}
      <div className="relative aspect-[16/10] overflow-hidden">
        {cover.avifSrcSet || cover.webpSrcSet ? (
          <picture>
            {cover.avifSrcSet ? (
              <source
                type="image/avif"
                srcSet={cover.avifSrcSet}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ) : null}
            {cover.webpSrcSet ? (
              <source
                type="image/webp"
                srcSet={cover.webpSrcSet}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ) : null}
            <img
              src={cover.fallbackUrl}
              alt={listing.propertyName}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          </picture>
        ) : (
          <img
            src={cover.fallbackUrl}
            alt={listing.propertyName}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Top badges */}
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold backdrop-blur-sm",
              categoryStyle.bg,
              categoryStyle.color,
            )}
          >
            {listing.category}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold backdrop-blur-sm",
              statusStyle.bg,
              statusStyle.color,
            )}
          >
            {statusStyle.icon}
            {listing.status}
          </span>
          <ListingGradeBadge askingPrice={listing.price} grading={grading} />
        </div>

        {/* Quick actions overlay */}
        <div className="absolute right-3 top-3 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={onEdit}
            className="rounded-full bg-white/90 p-2 text-slate-700 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-110"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            disabled={isPending}
            className="rounded-full bg-white/90 p-2 text-red-600 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-110 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Price tag */}
        <div className="absolute bottom-4 left-4">
          <p className="text-2xl font-bold text-white drop-shadow-lg">
            RM {listing.price.toLocaleString()}
          </p>
        </div>

        {/* External links */}
        {listing.externalLinks.length > 0 && (
          <div className="absolute bottom-4 right-4 flex gap-1.5">
            {listing.externalLinks.slice(0, 3).map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium text-slate-700 backdrop-blur-sm transition-all hover:bg-white hover:scale-105"
              >
                {link.provider}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5">
        <div className="mb-3">
          <h3 className="text-lg font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {listing.propertyName}
          </h3>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="line-clamp-1">
              {listing.buildingProject ? `${listing.buildingProject}, ` : ""}
              {listing.location}
            </span>
          </div>
        </div>

        {/* Property specs */}
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted/50 px-2 py-1">
            <Building2 className="h-3.5 w-3.5" />
            {listing.type}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted/50 px-2 py-1">
            <Bed className="h-3.5 w-3.5" />
            {listing.bedrooms}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted/50 px-2 py-1">
            <Bath className="h-3.5 w-3.5" />
            {listing.bathrooms}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted/50 px-2 py-1">
            <Maximize className="h-3.5 w-3.5" />
            {listing.size.toLocaleString()} sqft
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Process Progress</span>
            <span className="font-medium text-foreground">
              {completedStages}/{stageOrder.length}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <ProcessLogDialog
            userId={userId}
            listing={listing}
            entries={logEntries}
            onUpdated={onProcessLogUpdate}
          />
          <ListingReminderDialog
            listingId={listing.id}
            listingName={listing.propertyName}
          />

          <div className="ml-auto flex items-center gap-2">
            <Select
              value={listing.category}
              disabled={isPending}
              onValueChange={(value) =>
                onCategoryChange(value as ListingCategory)
              }
            >
              <SelectTrigger className="h-8 w-auto gap-1 text-xs border-dashed">
                <SelectValue />
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
              onValueChange={(value) => onStatusChange(value as ListingStatus)}
            >
              <SelectTrigger className="h-8 w-auto gap-1 text-xs border-dashed">
                <SelectValue />
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
        </div>
      </div>
    </motion.div>
  );
});

ListingCard.displayName = "ListingCard";

// Empty State Component
function EmptyState({
  hasFilters,
  onClearFilters,
}: {
  hasFilters: boolean;
  onClearFilters: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="mb-6 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 p-6">
        <Home className="h-12 w-12 text-primary/60" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        {hasFilters ? "No listings match your filters" : "No listings yet"}
      </h3>
      <p className="text-muted-foreground max-w-sm mb-6">
        {hasFilters
          ? "Try adjusting your filters or clear them to see all listings."
          : "Start building your property portfolio by adding your first listing."}
      </p>
      {hasFilters && (
        <Button variant="outline" onClick={onClearFilters}>
          Clear all filters
        </Button>
      )}
    </motion.div>
  );
}

// Main Component
export default function ListingsClient({
  userId,
  initialListings,
  initialProcessLogs,
}: ListingsClientProps) {
  const [listings, setListings] = useState<ListingInput[]>(initialListings);
  const [processLogMap, setProcessLogMap] =
    useState<ProcessLogMap>(initialProcessLogs);
  const [form, setForm] = useState<ListingFormValues>(emptyListing);
  const [error, setError] = useState<string | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<ListingInput | null>(
    null,
  );
  const [pendingCreatePhotos, setPendingCreatePhotos] = useState<File[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<"All" | ListingCategory>(
    "All",
  );
  const [statusFilter, setStatusFilter] = useState<"All" | ListingStatus>(
    "All",
  );
  const [locationFilter, setLocationFilter] = useState("");
  const [buildingProjectFilter, setBuildingProjectFilter] = useState("");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("");
  const [minPriceFilter, setMinPriceFilter] = useState("");
  const [maxPriceFilter, setMaxPriceFilter] = useState("");
  const [noEnquiryDaysFilter, setNoEnquiryDaysFilter] = useState("");
  const [expiringInDaysFilter, setExpiringInDaysFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const propertyTypesForSelect =
    form.type && !propertyTypeOptions.includes(form.type)
      ? [form.type, ...propertyTypeOptions]
      : propertyTypeOptions;

  const districtsForSelectedState = useMemo(
    () => malaysiaDistrictsForState(form.state),
    [form.state],
  );

  const formGrading = useMemo(
    () =>
      calculateListingGrading({
        askingPrice: form.price,
        bankValue: form.bankValue,
        competitorPriceRangeText: form.competitorPriceRange,
      }),
    [form.price, form.bankValue, form.competitorPriceRange],
  );

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
    const valuesToSave = editingListing
      ? form
      : (() => {
          if (!form.state || !form.district) {
            setError("Please select a state and district.");
            return null;
          }
          return {
            ...form,
            location: formatMalaysiaLocation(form.state, form.district),
          };
        })();

    if (!valuesToSave) {
      return;
    }

    const parsed = listingFormSchema.safeParse(valuesToSave);
    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message ?? "Please review the listing details.",
      );
      return;
    }
    startTransition(async () => {
      try {
        if (editingListing) {
          const updated = await updateListingAction(
            editingListing.id,
            { ...valuesToSave, photos: [] },
          );
          if (updated) {
            setListings((prev) =>
              prev.map((listing) => (listing.id === updated.id ? updated : listing)),
            );
          }
          setEditingListing(null);
        } else {
          const created = await createListingAction({
            ...valuesToSave,
            photos: [],
          });
          setListings((prev) => [created, ...prev]);

          if (pendingCreatePhotos.length) {
            const stagedKeys = await stageListingPhotos({
              listingId: created.id,
              files: pendingCreatePhotos,
            });
            const withPhotos = await ingestListingPhotosAction({
              listingId: created.id,
              stagedKeys,
            });
            setListings((prev) =>
              prev.map((listing) => (listing.id === withPhotos.id ? withPhotos : listing)),
            );
            setPendingCreatePhotos([]);
          }
        }
        setForm(() => ({ ...emptyListing }));
        setIsFormDialogOpen(false);
      } catch (actionError) {
        setError(
          actionError instanceof Error
            ? actionError.message
            : "Unable to save this listing.",
        );
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        const removed = await deleteListingAction(id);
        if (removed?.id) {
          setListings((prev) =>
            prev.filter((listing) => listing.id !== removed.id),
          );
        }
      } catch (actionError) {
        setError(
          actionError instanceof Error
            ? actionError.message
            : "Unable to delete this listing.",
        );
      }
    });
  };

  const handleStatusChange = (id: string, status: ListingStatus) => {
    startTransition(async () => {
      try {
        const updated = await updateListingStatusAction({ id, status });
        if (updated) {
          setListings((prev) =>
            prev.map((listing) =>
              listing.id === updated.id ? updated : listing,
            ),
          );
        }
      } catch (actionError) {
        setError(
          actionError instanceof Error
            ? actionError.message
            : "Unable to update the listing status.",
        );
      }
    });
  };

  const handleCategoryChange = (id: string, category: ListingCategory) => {
    startTransition(async () => {
      try {
        const updated = await updateListingCategoryAction({ id, category });
        if (updated) {
          setListings((prev) =>
            prev.map((listing) =>
              listing.id === updated.id ? updated : listing,
            ),
          );
        }
      } catch (actionError) {
        setError(
          actionError instanceof Error
            ? actionError.message
            : "Unable to update the listing category.",
        );
      }
    });
  };

  const filteredListings = useMemo(() => {
    const minPrice = minPriceFilter.trim() ? Number(minPriceFilter) : null;
    const maxPrice = maxPriceFilter.trim() ? Number(maxPriceFilter) : null;
    const noEnquiryDays = noEnquiryDaysFilter.trim()
      ? Number(noEnquiryDaysFilter)
      : null;
    const expiringInDays = expiringInDaysFilter.trim()
      ? Number(expiringInDaysFilter)
      : null;
    const now = new Date();
    const query = searchQuery.toLowerCase().trim();

    return listings.filter((listing) => {
      // Search query filter
      if (query) {
        const searchable =
          `${listing.propertyName} ${listing.location} ${listing.buildingProject ?? ""} ${listing.type}`.toLowerCase();
        if (!searchable.includes(query)) {
          return false;
        }
      }
      if (categoryFilter !== "All" && listing.category !== categoryFilter) {
        return false;
      }
      if (statusFilter !== "All" && listing.status !== statusFilter) {
        return false;
      }
      if (
        locationFilter.trim() &&
        !listing.location
          .toLowerCase()
          .includes(locationFilter.trim().toLowerCase())
      ) {
        return false;
      }
      if (
        propertyTypeFilter.trim() &&
        !listing.type
          .toLowerCase()
          .includes(propertyTypeFilter.trim().toLowerCase())
      ) {
        return false;
      }
      if (buildingProjectFilter.trim()) {
        const haystack =
          `${listing.buildingProject ?? ""} ${listing.propertyName}`.toLowerCase();
        if (!haystack.includes(buildingProjectFilter.trim().toLowerCase())) {
          return false;
        }
      }
      if (
        minPrice != null &&
        Number.isFinite(minPrice) &&
        listing.price < minPrice
      ) {
        return false;
      }
      if (
        maxPrice != null &&
        Number.isFinite(maxPrice) &&
        listing.price > maxPrice
      ) {
        return false;
      }
      if (noEnquiryDays != null && Number.isFinite(noEnquiryDays)) {
        if (!listing.lastEnquiryAt) {
        } else {
          const threshold = new Date(
            now.getTime() - noEnquiryDays * 24 * 60 * 60 * 1000,
          );
          if (listing.lastEnquiryAt >= threshold) {
            return false;
          }
        }
      }
      if (expiringInDays != null && Number.isFinite(expiringInDays)) {
        if (!listing.expiresAt) {
          return false;
        }
        const expiresBefore = new Date(
          now.getTime() + expiringInDays * 24 * 60 * 60 * 1000,
        );
        if (listing.expiresAt < now || listing.expiresAt > expiresBefore) {
          return false;
        }
      }
      return true;
    });
  }, [
    listings,
    categoryFilter,
    statusFilter,
    locationFilter,
    buildingProjectFilter,
    propertyTypeFilter,
    minPriceFilter,
    maxPriceFilter,
    noEnquiryDaysFilter,
    expiringInDaysFilter,
    searchQuery,
  ]);

  const activeFilters = useMemo(() => {
    const filters: { key: string; label: string; onRemove: () => void }[] = [];
    if (categoryFilter !== "All") {
      filters.push({
        key: "category",
        label: `Category: ${categoryFilter}`,
        onRemove: () => setCategoryFilter("All"),
      });
    }
    if (statusFilter !== "All") {
      filters.push({
        key: "status",
        label: `Status: ${statusFilter}`,
        onRemove: () => setStatusFilter("All"),
      });
    }
    if (locationFilter) {
      filters.push({
        key: "location",
        label: `Location: ${locationFilter}`,
        onRemove: () => setLocationFilter(""),
      });
    }
    if (buildingProjectFilter) {
      filters.push({
        key: "building",
        label: `Building: ${buildingProjectFilter}`,
        onRemove: () => setBuildingProjectFilter(""),
      });
    }
    if (propertyTypeFilter) {
      filters.push({
        key: "type",
        label: `Type: ${propertyTypeFilter}`,
        onRemove: () => setPropertyTypeFilter(""),
      });
    }
    if (minPriceFilter) {
      filters.push({
        key: "minPrice",
        label: `Min: RM ${Number(minPriceFilter).toLocaleString()}`,
        onRemove: () => setMinPriceFilter(""),
      });
    }
    if (maxPriceFilter) {
      filters.push({
        key: "maxPrice",
        label: `Max: RM ${Number(maxPriceFilter).toLocaleString()}`,
        onRemove: () => setMaxPriceFilter(""),
      });
    }
    return filters;
  }, [
    categoryFilter,
    statusFilter,
    locationFilter,
    buildingProjectFilter,
    propertyTypeFilter,
    minPriceFilter,
    maxPriceFilter,
  ]);

  const clearAllFilters = () => {
    setCategoryFilter("All");
    setStatusFilter("All");
    setLocationFilter("");
    setBuildingProjectFilter("");
    setPropertyTypeFilter("");
    setMinPriceFilter("");
    setMaxPriceFilter("");
    setNoEnquiryDaysFilter("");
    setExpiringInDaysFilter("");
    setSearchQuery("");
  };

  const handleProcessLogUpdate = (
    listingId: string,
    entry: ProcessLogEntry,
  ) => {
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
        [listingId]: sortProcessEntries(current),
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
    setPendingCreatePhotos([]);
    setError(null);
    setIsFormDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold tracking-tight"
            >
              Listing Management
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-2 text-slate-300"
            >
              Your centralized property inventory with workflow tracking and
              owner-ready sharing
            </motion.p>
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
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Button
                  onClick={() => openListingForm()}
                  className="gap-2 bg-white text-slate-900 hover:bg-slate-100 shadow-lg"
                  size="lg"
                >
                  <Plus className="h-5 w-5" />
                  New Listing
                </Button>
              </motion.div>
            </DialogTrigger>

            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {editingListing ? "Edit Listing" : "Create New Listing"}
                </DialogTitle>
                <DialogDescription>
                  {editingListing
                    ? "Update property details and share them instantly."
                    : "Add a new property to your portfolio with all the details."}
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={handleSubmit}
                className="mt-6 grid gap-5 md:grid-cols-2"
              >
                <div className="space-y-2">
                  <FieldLabel required>Property Name</FieldLabel>
                  <Input
                    required
                    value={form.propertyName}
                    onChange={(e) =>
                      setForm({ ...form, propertyName: e.target.value })
                    }
                    placeholder="e.g. Seri Maya Condo"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel>Lot / Unit No.</FieldLabel>
                  <Input
                    value={form.lotUnitNo ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        lotUnitNo: e.target.value.trim()
                          ? e.target.value
                          : undefined,
                      })
                    }
                    placeholder="e.g. B-12-3"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel required>Type</FieldLabel>
                  <Select
                    value={form.type || undefined}
                    onValueChange={(value) => setForm({ ...form, type: value })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyTypesForSelect.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <FieldLabel required>Category</FieldLabel>
                  <Select
                    value={
                      (form.category as ListingCategory | undefined) ??
                      ListingCategory.FOR_SALE
                    }
                    onValueChange={(value) =>
                      setForm({ ...form, category: value as ListingCategory })
                    }
                  >
                    <SelectTrigger className="h-11">
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
                  <FieldLabel required>Price (RM)</FieldLabel>
                  <Input
                    required
                    type="number"
                    min={0}
                    step={1}
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: Number(e.target.value) })
                    }
                    onFocus={selectAllIfZero}
                    onMouseUp={keepSelectionOnMouseUpIfZero}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel>Bank Value (RM)</FieldLabel>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={form.bankValue ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        bankValue: parseOptionalNumber(e.target.value),
                      })
                    }
                    onFocus={selectAllIfZero}
                    onMouseUp={keepSelectionOnMouseUpIfZero}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel>Competitor Price Range (RM)</FieldLabel>
                  <Input
                    value={form.competitorPriceRange ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        competitorPriceRange: e.target.value.trim()
                          ? e.target.value
                          : undefined,
                      })
                    }
                    placeholder="e.g. 520000 - 560000"
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tip: formats like <span className="font-medium">520000 - 560000</span> or{" "}
                    <span className="font-medium">520k-560k</span> work.
                  </p>
                </div>
                <div className="md:col-span-2 rounded-2xl border bg-muted/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        LeadLah listing grade
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Auto-calculated from asking price, competitor range, and bank value.
                      </p>
                    </div>
                    <Badge tone={gradeTone(formGrading.grade)} className="px-3 py-1">
                      {formGrading.grade
                        ? `${formGrading.grade} · ${formGrading.label}`
                        : "Needs data"}
                    </Badge>
                  </div>

                  {formGrading.missingInputs.length > 0 ? (
                    <div className="mt-3 rounded-xl border bg-background/60 px-3 py-2 text-xs text-muted-foreground">
                      Add{" "}
                      <span className="font-medium text-foreground">
                        {formGrading.missingInputs
                          .map((key) =>
                            key === "bankValue"
                              ? "Bank value"
                              : key === "competitorMinPrice" || key === "competitorMaxPrice"
                                ? "Competitor range"
                                : key,
                          )
                          .filter((v, i, arr) => arr.indexOf(v) === i)
                          .join(", ")}
                      </span>{" "}
                      to get a grade.
                    </div>
                  ) : null}

                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border bg-background/60 p-3">
                      <p className="text-[11px] text-muted-foreground">Market position</p>
                      <p className="mt-1 text-sm font-semibold text-foreground tabular-nums">
                        {formGrading.marketPositionPct == null
                          ? "—"
                          : `${Math.round(formGrading.marketPositionPct)}%`}
                      </p>
                      {formGrading.marketPositionPct != null ? (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {marketPositionCopy(formGrading.marketPositionPct)}
                        </p>
                      ) : null}
                    </div>
                    <div className="rounded-xl border bg-background/60 p-3">
                      <p className="text-[11px] text-muted-foreground">Bank value gap</p>
                      <p className="mt-1 text-sm font-semibold text-foreground tabular-nums">
                        {formGrading.bankValueGapPct == null
                          ? "—"
                          : formatSignedPct(formGrading.bankValueGapPct)}
                      </p>
                      {formGrading.bankValueGapPct != null ? (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {bankGapCopy(formGrading.bankValueGapPct)}
                        </p>
                      ) : null}
                    </div>
                    <div className="rounded-xl border bg-background/60 p-3">
                      <p className="text-[11px] text-muted-foreground">Competitor range</p>
                      <p className="mt-1 text-sm font-semibold text-foreground tabular-nums">
                        {formGrading.competitorMinPrice == null ||
                        formGrading.competitorMaxPrice == null
                          ? "—"
                          : `${formatRinggit(formGrading.competitorMinPrice)} – ${formatRinggit(formGrading.competitorMaxPrice)}`}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Parsed from your input
                      </p>
                    </div>
                  </div>

                  {formGrading.notes.length > 0 ? (
                    <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
                      {formGrading.notes.slice(0, 2).map((note, idx) => (
                        <p key={idx}>• {note}</p>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <FieldLabel required>Size (sqft)</FieldLabel>
                  <Input
                    required
                    type="number"
                    min={0}
                    step={1}
                    value={form.size}
                    onChange={(e) =>
                      setForm({ ...form, size: Number(e.target.value) })
                    }
                    onFocus={selectAllIfZero}
                    onMouseUp={keepSelectionOnMouseUpIfZero}
                    className="h-11"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <FieldLabel required>Bedrooms</FieldLabel>
                    <Input
                      required
                      type="number"
                      min={0}
                      step={1}
                      value={form.bedrooms}
                      onChange={(e) =>
                        setForm({ ...form, bedrooms: Number(e.target.value) })
                      }
                      onFocus={selectAllIfZero}
                      onMouseUp={keepSelectionOnMouseUpIfZero}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel required>Bathrooms</FieldLabel>
                    <Input
                      required
                      type="number"
                      min={0}
                      step={1}
                      value={form.bathrooms}
                      onChange={(e) =>
                        setForm({ ...form, bathrooms: Number(e.target.value) })
                      }
                      onFocus={selectAllIfZero}
                      onMouseUp={keepSelectionOnMouseUpIfZero}
                      className="h-11"
                    />
                  </div>
                </div>
                {editingListing ? (
                  <div className="space-y-2">
                    <FieldLabel required>Location</FieldLabel>
                    <Input
                      required
                      value={form.location}
                      onChange={(e) =>
                        setForm({ ...form, location: e.target.value })
                      }
                      placeholder="City / State"
                      className="h-11"
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <FieldLabel required>State</FieldLabel>
                      <Select
                        value={form.state ?? undefined}
                        onValueChange={(value) =>
                          setForm({
                            ...form,
                            state: value as MalaysiaState,
                            district: undefined,
                            location: "",
                          })
                        }
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {MALAYSIA_STATES.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <FieldLabel required>District</FieldLabel>
                      <Select
                        value={form.district ?? undefined}
                        onValueChange={(value) =>
                          setForm({ ...form, district: value, location: "" })
                        }
                        disabled={!form.state}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue
                            placeholder={
                              form.state
                                ? "Select district"
                                : "Select state first"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {districtsForSelectedState.map((district) => (
                            <SelectItem key={district} value={district}>
                              {district}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <FieldLabel>Building / Project</FieldLabel>
                  <Input
                    value={(form.buildingProject as string | undefined) ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        buildingProject: e.target.value.trim()
                          ? e.target.value
                          : undefined,
                      })
                    }
                    placeholder="e.g. Mont Kiara, Serenia City"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <ListingPhotosField
                    listingId={editingListing?.id ?? undefined}
                    photos={form.photos ?? []}
                    pendingFiles={editingListing ? undefined : pendingCreatePhotos}
                    onPendingFilesChange={
                      editingListing ? undefined : setPendingCreatePhotos
                    }
                    onListingUpdated={(updated) => {
                      setForm((prev) => ({ ...prev, photos: updated.photos ?? [] }));
                      setListings((prev) =>
                        prev.map((listing) =>
                          listing.id === updated.id ? updated : listing,
                        ),
                      );
                      setEditingListing(updated);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel required>Status</FieldLabel>
                  <Select
                    value={form.status}
                    onValueChange={(value) =>
                      setForm({ ...form, status: value as ListingStatus })
                    }
                  >
                    <SelectTrigger className="h-11">
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
                  <FieldLabel>Listing Expiry Date</FieldLabel>
                  <DatePicker
                    value={(form.expiresAt as string | undefined) ?? ""}
                    onChange={(val) =>
                      setForm({
                        ...form,
                        expiresAt: val ? val : undefined,
                      })
                    }
                    placeholder="Select expiry date"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used for expiring listing filters and reminders.
                  </p>
                </div>
                <div className="space-y-2">
                  <FieldLabel>Last Enquiry Date</FieldLabel>
                  <DatePicker
                    value={(form.lastEnquiryAt as string | undefined) ?? ""}
                    onChange={(val) =>
                      setForm({
                        ...form,
                        lastEnquiryAt: val ? val : undefined,
                      })
                    }
                    placeholder="Select enquiry date"
                  />
                  <p className="text-xs text-muted-foreground">
                    Helps identify listings with no enquiry for X days.
                  </p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <FieldLabel>External Portal Links</FieldLabel>
                  <div className="space-y-3">
                    {form.externalLinks.map((link, index) => (
                      <div
                        key={index}
                        className="grid gap-2 rounded-xl border border-border bg-muted/30 p-3 md:grid-cols-[180px_1fr_180px_auto]"
                      >
                        <Select
                          value={link.provider}
                          onValueChange={(value) =>
                            setForm({
                              ...form,
                              externalLinks: form.externalLinks.map(
                                (item, current) =>
                                  current === index
                                    ? { ...item, provider: value as any }
                                    : item,
                              ),
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Platform" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Mudah">Mudah</SelectItem>
                            <SelectItem value="PropertyGuru">
                              PropertyGuru
                            </SelectItem>
                            <SelectItem value="iProperty">iProperty</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="url"
                          value={link.url}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              externalLinks: form.externalLinks.map(
                                (item, current) =>
                                  current === index
                                    ? { ...item, url: e.target.value }
                                    : item,
                              ),
                            })
                          }
                          placeholder="https://propertyguru.com/..."
                        />
                        <DatePicker
                          value={(link.expiresAt as string | undefined) ?? ""}
                          onChange={(val) =>
                            setForm({
                              ...form,
                              externalLinks: form.externalLinks.map(
                                (item, current) =>
                                  current === index
                                    ? {
                                      ...item,
                                      expiresAt: val || undefined,
                                    }
                                    : item,
                              ),
                            })
                          }
                          placeholder="Link expiry"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setForm({
                              ...form,
                              externalLinks: form.externalLinks.filter(
                                (_, current) => current !== index,
                              ),
                            })
                          }
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setForm({
                          ...form,
                          externalLinks: [
                            ...form.externalLinks,
                            {
                              provider: "PropertyGuru",
                              url: "",
                              expiresAt: undefined,
                            } as any,
                          ],
                        })
                      }
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add portal link
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Add platform URLs + expiry dates to generate "listing
                    expiring in 1 day" reminders automatically.
                  </p>
                </div>
                <div className="md:col-span-2 flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-destructive">{error}</div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsFormDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="gap-2"
                    >
                      {isPending
                        ? "Saving..."
                        : editingListing
                          ? "Update Listing"
                          : "Create Listing"}
                    </Button>
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Stats */}
      <QuickStats listings={listings} />

      {/* Search and Filters */}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search listings..."
                className="pl-10 h-11"
              />
            </div>
            <Button
              variant={showFilters ? "secondary" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilters.length > 0 && (
                <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {activeFilters.length}
                </span>
              )}
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              {filteredListings.length} of {listings.length} listings
            </span>
          </div>
        </div>

        {/* Active filter chips */}
        <AnimatePresence>
          {activeFilters.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 flex flex-wrap items-center gap-2"
            >
              {activeFilters.map((filter) => (
                <FilterChip
                  key={filter.key}
                  label={filter.label}
                  onRemove={filter.onRemove}
                />
              ))}
              <button
                onClick={clearAllFilters}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear all
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 grid gap-4 border-t pt-4 md:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Location
                  </label>
                  <Input
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    placeholder="Any location"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Building / Project
                  </label>
                  <Input
                    value={buildingProjectFilter}
                    onChange={(e) => setBuildingProjectFilter(e.target.value)}
                    placeholder="Any building"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Property Type
                  </label>
                  <Input
                    value={propertyTypeFilter}
                    onChange={(e) => setPropertyTypeFilter(e.target.value)}
                    placeholder="Any type"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Category
                  </label>
                  <Select
                    value={categoryFilter}
                    onValueChange={(value) =>
                      setCategoryFilter(value as "All" | ListingCategory)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
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
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Status
                  </label>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) =>
                      setStatusFilter(value as "All" | ListingStatus)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
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
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Min Price (RM)
                  </label>
                  <Input
                    type="number"
                    value={minPriceFilter}
                    onChange={(e) => setMinPriceFilter(e.target.value)}
                    placeholder="No minimum"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Max Price (RM)
                  </label>
                  <Input
                    type="number"
                    value={maxPriceFilter}
                    onChange={(e) => setMaxPriceFilter(e.target.value)}
                    placeholder="No maximum"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    No Enquiry (days)
                  </label>
                  <Input
                    type="number"
                    value={noEnquiryDaysFilter}
                    onChange={(e) => setNoEnquiryDaysFilter(e.target.value)}
                    placeholder="Any"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Listings Grid */}
      {filteredListings.length === 0 ? (
        <EmptyState
          hasFilters={activeFilters.length > 0 || searchQuery.length > 0}
          onClearFilters={clearAllFilters}
        />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {filteredListings.map((listing) => (
              <ListingCard
                key={listing.id}
                userId={userId}
                listing={listing}
                logEntries={processLogMap[listing.id] ?? []}
                isPending={isPending}
                onEdit={() => openListingForm(listing)}
                onDelete={() => handleDelete(listing.id)}
                onStatusChange={(status) =>
                  handleStatusChange(listing.id, status)
                }
                onCategoryChange={(category) =>
                  handleCategoryChange(listing.id, category)
                }
                onProcessLogUpdate={(entry) =>
                  handleProcessLogUpdate(listing.id, entry)
                }
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

// Process Log Dialog Component
type ProcessLogDialogProps = {
  userId: string;
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
  viewedAt: "",
};

function ProcessLogDialog({
  userId,
  listing,
  entries,
  onUpdated,
}: ProcessLogDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<ProcessStage>(
    stageOrder[0],
  );
  const [notes, setNotes] = useState("");
  const [actor, setActor] = useState("");
  const [status, setStatus] = useState<"done" | "pending">("pending");
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [viewings, setViewings] = useState<ViewingCustomer[]>([]);
  const [successfulBuyerId, setSuccessfulBuyerId] = useState<string | null>(
    null,
  );
  const [viewingForm, setViewingForm] =
    useState<ViewingFormState>(emptyViewingForm);
  const [editingViewingId, setEditingViewingId] = useState<string | null>(null);
  const [viewingError, setViewingError] = useState<string | null>(null);
  const [isViewingsDialogOpen, setIsViewingsDialogOpen] = useState(false);
  const [ownerShareLink, setOwnerShareLink] = useState<string | null>(null);
  const [ownerShareExpiresAt, setOwnerShareExpiresAt] = useState<Date | null>(
    null,
  );
  const [ownerLinkError, setOwnerLinkError] = useState<string | null>(null);
  const [isGeneratingOwnerLink, setIsGeneratingOwnerLink] = useState(false);
  const [hasCopiedOwnerLink, setHasCopiedOwnerLink] = useState(false);

  const generateViewingId = () =>
    typeof crypto !== "undefined" &&
      "randomUUID" in crypto &&
      typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const toDatetimeLocalValue = (date: Date) => {
    const pad = (value: number) => value.toString().padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const completedCount = entries.filter((entry) => entry.completedAt).length;
  const pendingStage = useMemo(
    () => entries.find((entry) => !entry.completedAt)?.stage ?? stageOrder[0],
    [entries],
  );
  const isViewingStage = selectedStage === ProcessStage.VIEWING_RECORD;

  const handleViewingInputChange = (
    field: keyof ViewingFormState,
    value: string,
  ) => {
    setViewingForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddViewing = () => {
    if (!viewingForm.name.trim()) {
      setViewingError("Customer name is required.");
      return;
    }

    const viewedAt = viewingForm.viewedAt
      ? new Date(viewingForm.viewedAt)
      : undefined;
    if (viewedAt && Number.isNaN(viewedAt.getTime())) {
      setViewingError("Viewing date is invalid.");
      return;
    }

    const record: ViewingCustomer = {
      id: editingViewingId ?? generateViewingId(),
      name: viewingForm.name.trim(),
      phone: viewingForm.phone.trim() || undefined,
      email: viewingForm.email.trim() || undefined,
      notes: viewingForm.notes.trim() || undefined,
      viewedAt,
    };

    if (editingViewingId) {
      setViewings((prev) =>
        prev.map((viewing) =>
          viewing.id === editingViewingId ? record : viewing,
        ),
      );
    } else {
      setViewings((prev) => [...prev, record]);
    }
    setViewingForm(emptyViewingForm);
    setViewingError(null);
    setEditingViewingId(null);
  };

  const handleEditViewing = (viewing: ViewingCustomer) => {
    setEditingViewingId(viewing.id);
    setViewingForm({
      name: viewing.name ?? "",
      phone: viewing.phone ?? "",
      email: viewing.email ?? "",
      notes: viewing.notes ?? "",
      viewedAt: viewing.viewedAt ? toDatetimeLocalValue(viewing.viewedAt) : "",
    });
    setViewingError(null);
  };

  const cancelEditingViewing = () => {
    setEditingViewingId(null);
    setViewingForm(emptyViewingForm);
    setViewingError(null);
  };

  const handleRemoveViewing = (id: string) => {
    setViewings((prev) => prev.filter((viewing) => viewing.id !== id));
    if (successfulBuyerId === id) {
      setSuccessfulBuyerId(null);
    }
    if (editingViewingId === id) {
      cancelEditingViewing();
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
      timeStyle: "short",
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
      setOwnerLinkError(
        err instanceof Error ? err.message : "Unable to generate owner link.",
      );
      setOwnerShareLink(null);
      setOwnerShareExpiresAt(null);
    } finally {
      setIsGeneratingOwnerLink(false);
    }
  };

  const handleCopyOwnerLink = async () => {
    if (
      !ownerShareLink ||
      typeof navigator === "undefined" ||
      !navigator.clipboard?.writeText
    ) {
      return;
    }
    try {
      await navigator.clipboard.writeText(ownerShareLink);
      setHasCopiedOwnerLink(true);
    } catch (err) {
      setOwnerLinkError(
        err instanceof Error
          ? err.message
          : "Unable to copy link. Copy manually.",
      );
    }
  };

  useEffect(() => {
    if (!open) {
      setMessage(null);
      setViewingError(null);
      setViewingForm(emptyViewingForm);
      setEditingViewingId(null);
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
    setEditingViewingId(null);
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
      if (
        successfulBuyerId &&
        !viewings.some((viewing) => viewing.id === successfulBuyerId)
      ) {
        setViewingError("Selected buyer must be part of the viewing list.");
        setIsSaving(false);
        return;
      }
    }
    try {
      const payload = {
        userId,
        stage: selectedStage,
        notes: notes.trim() || undefined,
        actor: actor.trim() || undefined,
        completed: status === "done",
        viewings: isViewingStage ? viewings : undefined,
        successfulBuyerId: isViewingStage
          ? (successfulBuyerId ?? undefined)
          : undefined,
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
        text:
          err instanceof Error ? err.message : "Unable to update this stage.",
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
      month: "short",
    });
  };

  const formatDateTime = (value?: Date | null) => {
    if (!value) {
      return null;
    }
    return value.toLocaleString("en-MY", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Eye className="h-3.5 w-3.5" />
          Process
          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
            {completedCount}/{stageOrder.length}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden p-0">
        <div className="grid h-full md:grid-cols-[280px_1fr]">
          {/* Left sidebar - Timeline */}
          <div className="border-r border-border bg-muted/30 p-5 overflow-y-auto max-h-[85vh]">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-lg">Process Timeline</DialogTitle>
              <DialogDescription className="text-xs">
                Track progress for {listing.propertyName}
              </DialogDescription>
            </DialogHeader>

            {/* Owner share section */}
            <div className="mb-4 rounded-xl border border-dashed border-border bg-background p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Owner Access
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleGenerateOwnerLink}
                  disabled={isGeneratingOwnerLink}
                  className="h-7 text-xs"
                >
                  {isGeneratingOwnerLink ? "..." : "Generate"}
                </Button>
              </div>
              {ownerLinkError && (
                <p className="text-xs text-destructive">{ownerLinkError}</p>
              )}
              {ownerShareLink && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <code className="flex-1 rounded-lg bg-muted px-2 py-1.5 text-[10px] text-muted-foreground truncate">
                      {ownerShareLink}
                    </code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyOwnerLink}
                      className="h-7 w-7 p-0"
                    >
                      {hasCopiedOwnerLink ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Expires {formatDateTime(ownerShareExpiresAt)}
                  </p>
                </div>
              )}
            </div>

            {/* Timeline stages */}
            <div className="space-y-2">
              {stageOrder.map((stage, index) => {
                const entry = entries.find((item) => item.stage === stage);
                const isComplete = Boolean(entry?.completedAt);
                const isActive = selectedStage === stage;
                return (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => setSelectedStage(stage)}
                    className={cn(
                      "w-full flex items-start gap-3 rounded-xl p-3 text-left transition-all",
                      isActive
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-muted/50",
                    )}
                  >
                    <div className="flex flex-col items-center pt-0.5">
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full transition-colors",
                          isComplete
                            ? "bg-emerald-500"
                            : "bg-slate-300 dark:bg-slate-600",
                        )}
                      />
                      {index < stageOrder.length - 1 && (
                        <span
                          className={cn(
                            "mt-1 w-px flex-1 min-h-[20px]",
                            isComplete
                              ? "bg-emerald-200 dark:bg-emerald-800"
                              : "bg-slate-200 dark:bg-slate-700",
                          )}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground truncate">
                          {stage}
                        </span>
                        {isComplete && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                        {entry?.notes || "No notes"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right content - Stage details */}
          <div className="p-6 overflow-y-auto max-h-[85vh]">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-foreground">
                {selectedStage}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Update the status and add notes for this stage
              </p>
            </div>

            <div className="space-y-5">
              {/* Status toggle */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                <span className="text-sm font-medium">Status</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus("pending")}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      status === "pending"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                        : "bg-muted text-muted-foreground hover:bg-muted/80",
                    )}
                  >
                    Pending
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("done")}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      status === "done"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground hover:bg-muted/80",
                    )}
                  >
                    Completed
                  </button>
                </div>
              </div>

              {/* Actor field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Handled by
                </label>
                <Input
                  value={actor}
                  onChange={(e) => setActor(e.target.value)}
                  placeholder="Agent name or team member"
                  className="h-11"
                />
              </div>

              {/* Notes field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Notes
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add remarks or updates for this stage..."
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* Viewing records section */}
              {isViewingStage && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground">
                      Viewing Records
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      {viewings.length} viewings
                    </span>
                  </div>

                  {/* Add viewing form */}
                  <div className="grid gap-3 p-4 rounded-xl bg-muted/30 border border-dashed border-border">
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input
                        value={viewingForm.name}
                        onChange={(e) =>
                          handleViewingInputChange("name", e.target.value)
                        }
                        placeholder="Customer name *"
                      />
                      <Input
                        value={viewingForm.phone}
                        onChange={(e) =>
                          handleViewingInputChange("phone", e.target.value)
                        }
                        placeholder="Phone number"
                      />
                      <Input
                        value={viewingForm.email}
                        onChange={(e) =>
                          handleViewingInputChange("email", e.target.value)
                        }
                        placeholder="Email"
                      />
                      <DateTimePicker
                        value={viewingForm.viewedAt}
                        onChange={(val) =>
                          handleViewingInputChange("viewedAt", val)
                        }
                        placeholder="Viewing date & time"
                      />
                    </div>
                    <Input
                      value={viewingForm.notes}
                      onChange={(e) =>
                        handleViewingInputChange("notes", e.target.value)
                      }
                      placeholder="Notes about this viewing"
                    />
                    {viewingError && (
                      <p className="text-xs text-destructive">{viewingError}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleAddViewing}
                        className="w-fit gap-2"
                      >
                        {editingViewingId ? (
                          <Edit3 className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        {editingViewingId ? "Update Viewing" : "Add Viewing"}
                      </Button>
                      {editingViewingId ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={cancelEditingViewing}
                          className="w-fit"
                        >
                          Cancel
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {/* Viewing list */}
                  {viewings.length > 0 && (
                    <div className="space-y-2">
                      {viewings.map((viewing) => {
                        const isBuyer = successfulBuyerId === viewing.id;
                        return (
                          <div
                            key={viewing.id}
                            className={cn(
                              "flex items-center justify-between gap-3 p-3 rounded-xl border transition-all",
                              isBuyer
                                ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20"
                                : "bg-background border-border",
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground">
                                {viewing.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {[viewing.phone, viewing.email]
                                  .filter(Boolean)
                                  .join(" • ") || "No contact info"}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {viewingDateLabel(viewing.viewedAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant={isBuyer ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleSelectBuyer(viewing.id)}
                                className="text-xs"
                              >
                                {isBuyer ? "✓ Buyer" : "Mark as Buyer"}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditViewing(viewing)}
                                className="text-xs"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveViewing(viewing.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Message */}
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-3 rounded-lg text-sm",
                    message.tone === "success"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                      : "bg-destructive/10 text-destructive",
                  )}
                >
                  {message.text}
                </motion.div>
              )}

              {/* Save button */}
              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="gap-2"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
