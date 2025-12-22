"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit3,
  Eye,
  MapPin,
  Search,
  ShieldCheck,
  Trash2,
  User,
  X,
  XCircle,
} from "lucide-react";
import { ProcessStage, type ViewingCustomer } from "@leadlah/core";
import type { StoredReminder } from "@/lib/reminders/types";
import { formatDateTime, formatTime } from "@/lib/reminders/time";
import { completeReminderAction, dismissReminderAction } from "@/app/actions/reminders";
import { updateProcessStage } from "@/lib/process-log/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type StatusFilter = "Upcoming" | "Completed" | "Dismissed" | "All";
type EventTypeFilter = "All" | "Viewing" | "Inspection" | "Appointment";
type SourceFilter = "All" | "Reminders" | "Viewings";

type AppointmentsClientProps = {
  initialAppointments: StoredReminder[];
  initialViewingStages: ViewingStageSnapshot[];
  timezone: string;
};

type ViewingStageSnapshot = {
  listingId: string;
  listingName: string;
  notes?: string;
  actor?: string;
  completedAt?: Date;
  successfulBuyerId?: string;
  viewings: ViewingCustomer[];
};

type EventMeta = {
  eventType: "Viewing" | "Inspection" | "Appointment";
  contactName?: string;
  location?: string;
};

type ViewingEditFormState = {
  name: string;
  phone: string;
  email: string;
  notes: string;
  viewedAt: string;
  markAsBuyer: boolean;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number] },
  },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } },
};

const filterChipVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

const isEventMeta = (metadata: StoredReminder["metadata"]): metadata is { kind: "EVENT" } & EventMeta => {
  return !!metadata && typeof metadata === "object" && "kind" in metadata && metadata.kind === "EVENT";
};

const eventIconFor = (eventType?: string) => {
  if (eventType === "Viewing") {
    return Eye;
  }
  if (eventType === "Inspection") {
    return ShieldCheck;
  }
  return CalendarClock;
};

const toDatetimeLocalValue = (date: Date) => {
  const pad = (value: number) => value.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
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
        type="button"
        onClick={onRemove}
        className="rounded-full p-0.5 transition-colors hover:bg-primary/20"
      >
        <X className="h-3 w-3" />
      </button>
    </motion.span>
  );
}

function AppointmentCard({
  appointment,
  timezone,
  isPending,
  onComplete,
  onDismiss,
}: {
  appointment: StoredReminder;
  timezone: string;
  isPending: boolean;
  onComplete: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const meta = isEventMeta(appointment.metadata) ? appointment.metadata : null;
  const eventType = meta?.eventType ?? appointment.message;
  const Icon = eventIconFor(meta?.eventType);
  const now = Date.now();
  const isOverdue = appointment.status === "PENDING" && appointment.dueAt.getTime() < now;

  return (
    <motion.div variants={cardVariants} layout>
      <Card className="group overflow-hidden border-border/70 bg-card/90 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900/40">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-1 gap-4">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border",
                isOverdue
                  ? "border-red-200 bg-red-50 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
                  : "border-border bg-muted/40 text-primary dark:bg-slate-800/60"
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-base font-semibold text-foreground">
                  {appointment.listingName ?? "Listing"}
                </p>
                <Badge tone="primary">{eventType}</Badge>
                {isOverdue ? (
                  <Badge tone="danger">Overdue</Badge>
                ) : appointment.status === "DONE" ? (
                  <Badge tone="success">Completed</Badge>
                ) : appointment.status === "DISMISSED" ? (
                  <Badge tone="neutral">Dismissed</Badge>
                ) : (
                  <Badge tone="info">Scheduled</Badge>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {formatDateTime(appointment.dueAt, timezone)}
                </span>
                {meta?.location ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {meta.location}
                  </span>
                ) : null}
                {meta?.contactName ? (
                  <span className="inline-flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    {meta.contactName}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {appointment.status === "PENDING" ? (
            <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
              <Button
                size="sm"
                variant="secondary"
                className="h-9 gap-2"
                disabled={isPending}
                onClick={() => onComplete(appointment.id)}
              >
                <CheckCircle2 className="h-4 w-4" />
                Done
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-9 gap-2"
                disabled={isPending}
                onClick={() => onDismiss(appointment.id)}
              >
                <XCircle className="h-4 w-4" />
                Dismiss
              </Button>
            </div>
          ) : (
            <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {formatTime(appointment.dueAt, timezone)}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

function ViewingCard({
  listingName,
  viewing,
  isSuccessfulBuyer,
  actor,
  stageNotes,
  timezone,
  isPending,
  onEdit,
  onRemove,
  onToggleBuyer,
}: {
  listingName: string;
  viewing: ViewingCustomer;
  isSuccessfulBuyer: boolean;
  actor?: string;
  stageNotes?: string;
  timezone: string;
  isPending: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onToggleBuyer: () => void;
}) {
  const viewedAtLabel = viewing.viewedAt ? formatDateTime(viewing.viewedAt, timezone) : "Viewing scheduled";
  const now = Date.now();
  const isUpcoming = !viewing.viewedAt || viewing.viewedAt.getTime() >= now;
  const Icon = eventIconFor("Viewing");

  return (
    <motion.div variants={cardVariants} layout>
      <Card className="group overflow-hidden border-border/70 bg-card/90 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900/40">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-1 gap-4">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border",
                isSuccessfulBuyer
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                  : "border-border bg-muted/40 text-primary dark:bg-slate-800/60"
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-base font-semibold text-foreground">{listingName}</p>
                <Badge tone="primary">Viewing</Badge>
                {isSuccessfulBuyer ? <Badge tone="success">Buyer</Badge> : null}
                {isUpcoming ? <Badge tone="info">Scheduled</Badge> : <Badge tone="neutral">Past</Badge>}
              </div>
              <p className="mt-1 text-sm font-semibold text-foreground">{viewing.name}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {viewedAtLabel}
                </span>
                {actor ? (
                  <span className="inline-flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    {actor}
                  </span>
                ) : null}
                {viewing.phone ? (
                  <span className="inline-flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    {viewing.phone}
                  </span>
                ) : null}
                {viewing.email ? (
                  <span className="inline-flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    {viewing.email}
                  </span>
                ) : null}
              </div>
              {viewing.notes ? (
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{viewing.notes}</p>
              ) : null}
              {!viewing.notes && stageNotes ? (
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{stageNotes}</p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
            <Button
              type="button"
              size="sm"
              variant={isSuccessfulBuyer ? "default" : "secondary"}
              className="h-9 gap-2"
              disabled={isPending}
              onClick={onToggleBuyer}
            >
              <CheckCircle2 className="h-4 w-4" />
              {isSuccessfulBuyer ? "Buyer" : "Mark Buyer"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-9 gap-2"
              disabled={isPending}
              onClick={onEdit}
            >
              <Edit3 className="h-4 w-4" />
              Edit
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9 gap-2"
              disabled={isPending}
              onClick={onRemove}
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

type TimelineItem =
  | {
      kind: "REMINDER";
      id: string;
      listingName: string;
      eventType?: EventTypeFilter;
      timestamp: number;
      reminder: StoredReminder;
    }
  | {
      kind: "VIEWING";
      id: string;
      listingId: string;
      listingName: string;
      eventType: "Viewing";
      timestamp: number | null;
      viewing: ViewingCustomer;
      successfulBuyerId?: string;
      stageNotes?: string;
      stageActor?: string;
    };

export function AppointmentsClient({
  initialAppointments,
  initialViewingStages,
  timezone,
}: AppointmentsClientProps) {
  const [appointments, setAppointments] = useState<StoredReminder[]>(initialAppointments);
  const [viewingStages, setViewingStages] = useState<ViewingStageSnapshot[]>(initialViewingStages);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Upcoming");
  const [eventTypeFilter, setEventTypeFilter] = useState<EventTypeFilter>("All");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("All");
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<null | { listingId: string; viewingId: string }>(null);
  const [viewingEdit, setViewingEdit] = useState<ViewingEditFormState>({
    name: "",
    phone: "",
    email: "",
    notes: "",
    viewedAt: "",
    markAsBuyer: false,
  });
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setAppointments(initialAppointments);
  }, [initialAppointments]);

  useEffect(() => {
    setViewingStages(initialViewingStages);
  }, [initialViewingStages]);

  const now = Date.now();

  const items = useMemo<TimelineItem[]>(() => {
    const reminderItems: TimelineItem[] = appointments.map((reminder) => {
      const meta = isEventMeta(reminder.metadata) ? reminder.metadata : null;
      const eventType = meta?.eventType;
      return {
        kind: "REMINDER",
        id: reminder.id,
        listingName: reminder.listingName ?? "Listing",
        eventType: eventType as EventTypeFilter | undefined,
        timestamp: reminder.dueAt.getTime(),
        reminder,
      };
    });

    const viewingItems: TimelineItem[] = viewingStages.flatMap((stage) =>
      stage.viewings.map((viewing) => ({
        kind: "VIEWING",
        id: `${stage.listingId}:${viewing.id}`,
        listingId: stage.listingId,
        listingName: stage.listingName,
        eventType: "Viewing",
        timestamp: viewing.viewedAt ? viewing.viewedAt.getTime() : null,
        viewing,
        successfulBuyerId: stage.successfulBuyerId,
        stageNotes: stage.notes,
        stageActor: stage.actor,
      }))
    );

    return [...reminderItems, ...viewingItems];
  }, [appointments, viewingStages]);

  const stats = useMemo(() => {
    const overdue = appointments.filter((r) => r.status === "PENDING" && r.dueAt.getTime() < now).length;

    const upcomingReminders = appointments.filter((r) => r.status === "PENDING" && r.dueAt.getTime() >= now).length;
    const upcomingViewings = viewingStages
      .flatMap((stage) => stage.viewings)
      .filter((viewing) => !viewing.viewedAt || viewing.viewedAt.getTime() >= now).length;

    const completedReminders = appointments.filter((r) => r.status === "DONE").length;
    const completedViewings = viewingStages
      .flatMap((stage) => stage.viewings)
      .filter((viewing) => viewing.viewedAt && viewing.viewedAt.getTime() < now).length;

    return {
      upcoming: upcomingReminders + upcomingViewings,
      overdue,
      completed: completedReminders + completedViewings,
      total: items.length,
    };
  }, [appointments, items.length, now, viewingStages]);

  const activeFilters = useMemo(() => {
    const filters: Array<{ key: string; label: string; clear: () => void }> = [];
    if (sourceFilter !== "All") {
      filters.push({ key: "source", label: `Source: ${sourceFilter}`, clear: () => setSourceFilter("All") });
    }
    if (statusFilter !== "Upcoming") {
      filters.push({ key: "status", label: `Status: ${statusFilter}`, clear: () => setStatusFilter("Upcoming") });
    }
    if (eventTypeFilter !== "All") {
      filters.push({ key: "type", label: `Type: ${eventTypeFilter}`, clear: () => setEventTypeFilter("All") });
    }
    if (query.trim()) {
      filters.push({ key: "query", label: `Search: ${query.trim()}`, clear: () => setQuery("") });
    }
    return filters;
  }, [eventTypeFilter, query, sourceFilter, statusFilter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const matchesQuery = (item: TimelineItem) => {
      if (!q) {
        return true;
      }
      if (item.kind === "REMINDER") {
        const reminder = item.reminder;
        const meta = isEventMeta(reminder.metadata) ? reminder.metadata : null;
        const haystack = [
          reminder.listingName,
          reminder.message,
          meta?.eventType,
          meta?.location,
          meta?.contactName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      }

      const haystack = [
        item.listingName,
        item.viewing.name,
        item.viewing.phone,
        item.viewing.email,
        item.viewing.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    };

    const matchesEventType = (item: TimelineItem) => {
      if (eventTypeFilter === "All") {
        return true;
      }
      const type = item.kind === "REMINDER" ? item.eventType : item.eventType;
      return type === eventTypeFilter;
    };

    const matchesSource = (item: TimelineItem) => {
      if (sourceFilter === "All") {
        return true;
      }
      return sourceFilter === "Reminders" ? item.kind === "REMINDER" : item.kind === "VIEWING";
    };

    const matchesStatus = (item: TimelineItem) => {
      if (statusFilter === "All") {
        return true;
      }
      if (statusFilter === "Dismissed") {
        return item.kind === "REMINDER" && item.reminder.status === "DISMISSED";
      }
      if (statusFilter === "Completed") {
        if (item.kind === "REMINDER") {
          return item.reminder.status === "DONE";
        }
        return item.timestamp != null && item.timestamp < now;
      }
      if (item.kind === "REMINDER") {
        return item.reminder.status === "PENDING";
      }
      return item.timestamp == null || item.timestamp >= now;
    };

    const result = items.filter(matchesSource).filter(matchesQuery).filter(matchesEventType).filter(matchesStatus);

    const sortAscending = statusFilter === "Upcoming";
    return [...result].sort((a, b) => {
      const left = a.kind === "REMINDER" ? a.timestamp : a.timestamp ?? Number.POSITIVE_INFINITY;
      const right = b.kind === "REMINDER" ? b.timestamp : b.timestamp ?? Number.POSITIVE_INFINITY;
      return sortAscending ? left - right : right - left;
    });
  }, [eventTypeFilter, items, now, query, sourceFilter, statusFilter]);

  const complete = (id: string) => {
    setError(null);
    startTransition(async () => {
      try {
        await completeReminderAction(id);
        const completedAt = new Date();
        setAppointments((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: "DONE", completedAt } : item))
        );
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "Unable to complete this appointment.");
      }
    });
  };

  const dismiss = (id: string) => {
    setError(null);
    startTransition(async () => {
      try {
        await dismissReminderAction(id);
        const dismissedAt = new Date();
        setAppointments((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: "DISMISSED", dismissedAt } : item))
        );
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "Unable to dismiss this appointment.");
      }
    });
  };

  const persistViewingStage = async (listingId: string, viewings: ViewingCustomer[], successfulBuyerId?: string) => {
    const updated = await updateProcessStage(listingId, {
      stage: ProcessStage.VIEWING_RECORD,
      viewings,
      successfulBuyerId,
    });
    setViewingStages((prev) =>
      prev.map((stage) =>
        stage.listingId === listingId
          ? {
              ...stage,
              viewings: updated.viewings ?? [],
              successfulBuyerId: updated.successfulBuyerId,
              notes: updated.notes,
              actor: updated.actor,
              completedAt: updated.completedAt,
            }
          : stage
      )
    );
  };

  const openEdit = (listingId: string, viewingId: string) => {
    setError(null);
    const stage = viewingStages.find((item) => item.listingId === listingId);
    const viewing = stage?.viewings.find((item) => item.id === viewingId);
    if (!stage || !viewing) {
      setError("Unable to load this viewing record.");
      return;
    }
    setEditing({ listingId, viewingId });
    setViewingEdit({
      name: viewing.name ?? "",
      phone: viewing.phone ?? "",
      email: viewing.email ?? "",
      notes: viewing.notes ?? "",
      viewedAt: viewing.viewedAt ? toDatetimeLocalValue(viewing.viewedAt) : "",
      markAsBuyer: stage.successfulBuyerId === viewingId,
    });
  };

  const removeViewing = (listingId: string, viewingId: string) => {
    setError(null);
    const stage = viewingStages.find((item) => item.listingId === listingId);
    if (!stage) {
      setError("Unable to remove this viewing record.");
      return;
    }
    if (stage.viewings.length <= 1) {
      setError("Viewing stage must contain at least one record.");
      return;
    }
    if (typeof window !== "undefined" && !window.confirm("Remove this viewing record?")) {
      return;
    }
    startTransition(async () => {
      try {
        const nextViewings = stage.viewings.filter((item) => item.id !== viewingId);
        const nextBuyerId = stage.successfulBuyerId === viewingId ? undefined : stage.successfulBuyerId;
        await persistViewingStage(listingId, nextViewings, nextBuyerId);
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "Unable to remove this viewing record.");
      }
    });
  };

  const toggleBuyer = (listingId: string, viewingId: string) => {
    setError(null);
    const stage = viewingStages.find((item) => item.listingId === listingId);
    if (!stage) {
      setError("Unable to update this viewing record.");
      return;
    }
    startTransition(async () => {
      try {
        const nextBuyerId = stage.successfulBuyerId === viewingId ? undefined : viewingId;
        await persistViewingStage(listingId, stage.viewings, nextBuyerId);
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "Unable to update this viewing record.");
      }
    });
  };

  const saveEditingViewing = () => {
    if (!editing) {
      return;
    }
    setError(null);
    const name = viewingEdit.name.trim();
    if (!name) {
      setError("Customer name is required.");
      return;
    }
    const stage = viewingStages.find((item) => item.listingId === editing.listingId);
    if (!stage) {
      setError("Unable to save this viewing record.");
      return;
    }

    startTransition(async () => {
      try {
        const nextViewings = stage.viewings.map((viewing) => {
          if (viewing.id !== editing.viewingId) {
            return viewing;
          }
          return {
            ...viewing,
            name,
            phone: viewingEdit.phone.trim() || undefined,
            email: viewingEdit.email.trim() || undefined,
            notes: viewingEdit.notes.trim() || undefined,
            viewedAt: viewingEdit.viewedAt ? new Date(viewingEdit.viewedAt) : undefined,
          };
        });

        const currentBuyerId = stage.successfulBuyerId;
        const nextBuyerId = viewingEdit.markAsBuyer
          ? editing.viewingId
          : currentBuyerId === editing.viewingId
          ? undefined
          : currentBuyerId;

        await persistViewingStage(editing.listingId, nextViewings, nextBuyerId);
        setEditing(null);
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "Unable to save this viewing record.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-3xl font-bold tracking-tight"
            >
              Appointments
              <CalendarClock className="h-6 w-6 text-amber-400" />
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-2 max-w-2xl text-slate-300"
            >
              View every viewing, inspection, and appointment across your listings — with quick actions to keep your
              schedule clean.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center gap-3"
          >
            <Badge tone="neutral" className="border-white/10 bg-white/10 text-white">
              {timezone}
            </Badge>
            <Button
              asChild
              size="lg"
              className="gap-2 bg-white text-slate-900 shadow-lg hover:bg-slate-100"
            >
              <Link href="/listings">
                <Calendar className="h-5 w-5" />
                Add Appointment
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Upcoming", value: stats.upcoming, icon: CalendarClock, color: "text-emerald-600" },
          { label: "Overdue", value: stats.overdue, icon: Clock, color: "text-rose-600" },
          { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-blue-600" },
          { label: "Total", value: stats.total, icon: Calendar, color: "text-amber-600" },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-white to-slate-50/50 p-4 shadow-sm transition-all hover:shadow-md dark:from-slate-900 dark:to-slate-800/50"
          >
            <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br from-primary/5 to-transparent" />
            <stat.icon className={cn("mb-2 h-5 w-5", stat.color)} />
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <Card className="border-border/70 bg-card/90 p-5 dark:bg-slate-900/40">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search listing, contact, or location..."
                className="h-11 pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(["Upcoming", "Completed", "Dismissed", "All"] as const).map((value) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={statusFilter === value ? "default" : "secondary"}
                  className="h-9"
                  onClick={() => setStatusFilter(value)}
                >
                  {value}
                </Button>
              ))}
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-9 gap-2"
                onClick={() => setShowFilters((prev) => !prev)}
              >
                Filters
                {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {showFilters ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-muted/25 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Source</p>
                  <div className="flex flex-wrap gap-2">
                    {(["All", "Reminders", "Viewings"] as const).map((value) => (
                      <Button
                        key={value}
                        type="button"
                        size="sm"
                        variant={sourceFilter === value ? "default" : "secondary"}
                        className="h-9"
                        onClick={() => setSourceFilter(value)}
                      >
                        {value}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Event type</p>
                  <div className="flex flex-wrap gap-2">
                    {(["All", "Viewing", "Inspection", "Appointment"] as const).map((value) => (
                      <Button
                        key={value}
                        type="button"
                        size="sm"
                        variant={eventTypeFilter === value ? "default" : "secondary"}
                        className="h-9"
                        onClick={() => setEventTypeFilter(value)}
                      >
                        {value}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {error ? (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100">
            {error}
          </p>
        ) : null}

        {activeFilters.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <AnimatePresence>
              {activeFilters.map((filter) => (
                <FilterChip key={filter.key} label={filter.label} onRemove={filter.clear} />
              ))}
            </AnimatePresence>
          </div>
        ) : null}
      </Card>

      {filtered.length ? (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
          <AnimatePresence initial={false}>
            {filtered.map((item) =>
              item.kind === "REMINDER" ? (
                <AppointmentCard
                  key={item.id}
                  appointment={item.reminder}
                  timezone={timezone}
                  isPending={isPending}
                  onComplete={complete}
                  onDismiss={dismiss}
                />
              ) : (
                <ViewingCard
                  key={item.id}
                  listingName={item.listingName}
                  viewing={item.viewing}
                  isSuccessfulBuyer={item.successfulBuyerId === item.viewing.id}
                  actor={item.stageActor}
                  stageNotes={item.stageNotes}
                  timezone={timezone}
                  isPending={isPending}
                  onEdit={() => openEdit(item.listingId, item.viewing.id)}
                  onRemove={() => removeViewing(item.listingId, item.viewing.id)}
                  onToggleBuyer={() => toggleBuyer(item.listingId, item.viewing.id)}
                />
              )
            )}
          </AnimatePresence>
        </motion.div>
      ) : (
        <Card className="border-border/70 bg-card/90 p-10 text-center dark:bg-slate-900/40">
          <div className="mx-auto flex max-w-md flex-col items-center gap-3">
            <div className="rounded-2xl bg-muted p-4">
              <CalendarClock className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold text-foreground">No appointments found</p>
            <p className="text-sm text-muted-foreground">
              Create a viewing or appointment from any listing to see it appear here.
            </p>
            <Button asChild className="mt-2 gap-2">
              <Link href="/listings">
                <Calendar className="h-4 w-4" />
                Go to Listings
              </Link>
            </Button>
          </div>
        </Card>
      )}

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit viewing</DialogTitle>
            <DialogDescription>Update buyer details and viewing date/time.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 pt-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Customer name *</label>
              <Input
                value={viewingEdit.name}
                onChange={(e) => setViewingEdit((prev) => ({ ...prev, name: e.target.value }))}
                className="h-11"
                placeholder="Customer name"
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Phone</label>
                <Input
                  value={viewingEdit.phone}
                  onChange={(e) => setViewingEdit((prev) => ({ ...prev, phone: e.target.value }))}
                  className="h-11"
                  placeholder="Phone number"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input
                  value={viewingEdit.email}
                  onChange={(e) => setViewingEdit((prev) => ({ ...prev, email: e.target.value }))}
                  className="h-11"
                  placeholder="Email"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Viewed at</label>
              <Input
                type="datetime-local"
                value={viewingEdit.viewedAt}
                onChange={(e) => setViewingEdit((prev) => ({ ...prev, viewedAt: e.target.value }))}
                className="h-11"
              />
              {editing && !viewingEdit.viewedAt ? (
                <p className="text-xs text-muted-foreground">
                  Leave blank to keep it as “scheduled”.
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Notes</label>
              <Textarea
                value={viewingEdit.notes}
                onChange={(e) => setViewingEdit((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Notes about this viewing"
                className="min-h-[96px] resize-none"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 bg-muted/25 p-3">
              <input
                type="checkbox"
                checked={viewingEdit.markAsBuyer}
                onChange={(e) => setViewingEdit((prev) => ({ ...prev, markAsBuyer: e.target.checked }))}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <div>
                <p className="text-sm font-medium text-foreground">Mark as successful buyer</p>
                <p className="text-xs text-muted-foreground">This will mark this contact as the buyer for the listing.</p>
              </div>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setEditing(null)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="button" onClick={saveEditingViewing} disabled={isPending}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
