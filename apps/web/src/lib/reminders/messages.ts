import { addDays, addMonths, addWeeks, setHours, setMinutes, setSeconds, subDays } from "date-fns";
import type { ExternalLink } from "@leadlah/core";
import type { ReminderMetadata, ReminderRecurrence } from "./types";

export function buildPlatformExpiryReminder(externalLink: ExternalLink, opts?: { leadDays?: number }) {
  const leadDays = opts?.leadDays ?? 1;
  if (!externalLink.expiresAt) {
    return null;
  }

  const expiresAt = new Date(externalLink.expiresAt);
  const actionAt = subDays(expiresAt, leadDays);
  const dueAt = setSeconds(setMinutes(setHours(actionAt, 9), 0), 0);
  const provider = externalLink.provider;
  const dayLabel = leadDays === 0 ? "today" : leadDays === 1 ? "in 1 day" : `in ${leadDays} days`;
  const message = `${provider} listing expiring ${dayLabel} — kindly renew.`;
  const metadata: ReminderMetadata = {
    kind: "PLATFORM_EXPIRY",
    provider,
    url: externalLink.url,
    expiresAt: expiresAt.toISOString(),
    leadDays
  };

  return { dueAt, message, metadata };
}

export function buildListingEventReminder(values: {
  eventType: "Viewing" | "Inspection" | "Appointment";
  dueAt: Date;
  contactName?: string;
  location?: string;
}) {
  const metadata: ReminderMetadata = {
    kind: "EVENT",
    eventType: values.eventType,
    contactName: values.contactName,
    location: values.location
  };

  return {
    message: values.eventType,
    metadata
  };
}

export function buildFollowUpReminder(values: { contactName?: string; channel?: "Call" | "WhatsApp" | "Email" }) {
  const metadata: ReminderMetadata = {
    kind: "FOLLOW_UP",
    contactName: values.contactName,
    channel: values.channel
  };

  const message = values.contactName ? `Follow up with ${values.contactName}.` : "Follow up with buyer / tenant.";
  return { message, metadata };
}

export function buildOwnerUpdateReminder(values: {
  cadence: "Weekly" | "Monthly";
  recommendation?: string;
}) {
  const metadata: ReminderMetadata = {
    kind: "OWNER_UPDATE",
    cadence: values.cadence,
    recommendation: values.recommendation
  };

  return {
    message: values.recommendation ?? `${values.cadence} owner update reminder.`,
    metadata
  };
}

export function nextDueAt(from: Date, recurrence: ReminderRecurrence, interval: number) {
  if (recurrence === "WEEKLY") {
    return addWeeks(from, interval);
  }
  if (recurrence === "MONTHLY") {
    return addMonths(from, interval);
  }
  return from;
}

export function defaultOwnerUpdateDueAt(now: Date, recurrence: ReminderRecurrence) {
  if (recurrence === "WEEKLY") {
    return addDays(now, 7);
  }
  if (recurrence === "MONTHLY") {
    return addMonths(now, 1);
  }
  return addDays(now, 1);
}

