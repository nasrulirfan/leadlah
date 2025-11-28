import { Injectable } from "@nestjs/common";
import { Reminder, ReminderType, buildPortalReminders, buildTenancyRenewalReminders } from "@leadlah/core";

@Injectable()
export class RemindersService {
  private reminders: Reminder[] = [];

  add(reminder: Reminder) {
    this.reminders.push(reminder);
    return reminder;
  }

  schedulePortal(listingId: string, days: number) {
    const items = buildPortalReminders(listingId, days);
    this.reminders.push(...items);
    return items;
  }

  scheduleTenancy(listingId: string, tenancyEnd: Date) {
    const items = buildTenancyRenewalReminders(listingId, tenancyEnd);
    this.reminders.push(...items);
    return items;
  }

  list(type?: ReminderType) {
    return type ? this.reminders.filter((r) => r.type === type) : this.reminders;
  }
}
