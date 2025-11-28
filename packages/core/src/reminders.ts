import { addDays, addMonths } from "date-fns";
import { Reminder, ReminderType } from "./types";
import { v4 as uuid } from "uuid";

export type ReminderConfig = {
  listingId?: string;
  contactId?: string;
  baseDate: Date;
  type: ReminderType;
  offsetDays: number;
  message: string;
};

export function scheduleReminder(config: ReminderConfig): Reminder {
  const dueAt = addDays(config.baseDate, config.offsetDays);
  return {
    id: uuid(),
    listingId: config.listingId,
    contactId: config.contactId,
    type: config.type,
    dueAt,
    message: config.message
  };
}

export function buildPortalReminders(listingId: string, days: number): Reminder[] {
  const createdAt = new Date();
  const expiry = addDays(createdAt, days);
  return [
    scheduleReminder({
      listingId,
      baseDate: expiry,
      offsetDays: -3,
      type: "PORTAL_EXPIRY",
      message: "Portal ad expires in 3 days. Renew to stay live."
    }),
    scheduleReminder({
      listingId,
      baseDate: expiry,
      offsetDays: 0,
      type: "PORTAL_EXPIRY",
      message: "Portal ad expires today. Renew now to keep leads flowing."
    })
  ];
}

export function buildTenancyRenewalReminders(
  listingId: string,
  tenancyEnd: Date
): Reminder[] {
  const alert = addMonths(tenancyEnd, -2);
  return [
    {
      id: uuid(),
      listingId,
      type: "TENANCY_RENEWAL",
      dueAt: alert,
      message: "Tenancy renewal is due in 2 months."
    }
  ];
}
