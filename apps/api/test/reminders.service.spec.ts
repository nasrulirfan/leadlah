import { ReminderType } from "@leadlah/core";
import { describe, beforeEach, expect, it, vi, afterEach } from "vitest";
import { RemindersService } from "../src/reminders/reminders.service";

describe("RemindersService", () => {
  let service: RemindersService;

  beforeEach(() => {
    service = new RemindersService();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("records ad portal reminders", () => {
    const reminders = service.schedulePortal("listing", 10);

    expect(reminders).toHaveLength(2);
    expect(reminders.every((r) => r.type === "PORTAL_EXPIRY")).toBe(true);
    expect(service.list()).toHaveLength(2);

    const dueDates = reminders.map((r) => r.dueAt.toISOString());
    expect(dueDates[1]).toBe("2025-01-11T00:00:00.000Z");
  });

  it("creates tenancy reminders and filters by type", () => {
    const tenancyEnd = new Date("2025-06-01T00:00:00Z");
    const reminders = service.scheduleTenancy("listing", tenancyEnd);

    expect(reminders).toHaveLength(1);
    expect(reminders[0].type).toBe<ReminderType>("TENANCY_RENEWAL");
    expect(service.list("TENANCY_RENEWAL")).toHaveLength(1);
    expect(service.list("PORTAL_EXPIRY")).toHaveLength(0);
  });

  it("adds ad-hoc reminders", () => {
    const reminder = service.add({
      id: "manual",
      type: "LEAD_FOLLOWUP",
      listingId: "listing",
      dueAt: new Date(),
      message: "Follow up with owner"
    });

    expect(reminder.id).toBe("manual");
    expect(service.list()).toContainEqual(reminder);
  });
});
