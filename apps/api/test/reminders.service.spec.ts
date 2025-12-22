import { ReminderType } from "@leadlah/core";
import { describe, beforeEach, expect, it, vi, afterEach } from "vitest";
import { RemindersService } from "../src/reminders/reminders.service";
import type { Repository } from "typeorm";
import type { ReminderEntity } from "../src/reminders/entities/reminder.entity";

describe("RemindersService", () => {
  let service: RemindersService;
  let repository: Partial<Record<keyof Repository<ReminderEntity>, ReturnType<typeof vi.fn>>>;
  let counter = 1;

  beforeEach(() => {
    counter = 1;
    repository = {
      create: vi.fn((payload: any) => ({
        id: `mock-${counter++}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
        dismissedAt: null,
        ...payload
      })),
      save: vi.fn(async (payload: any) => payload),
      find: vi.fn(async () => []),
      findOne: vi.fn(async () => null)
    };

    service = new RemindersService(repository as unknown as Repository<ReminderEntity>);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("records ad portal reminders", () => {
    const reminders = service.schedulePortal("user", "listing", 10);

    return reminders.then((items) => {
      expect(items).toHaveLength(2);
      expect(items.every((r) => r.type === "PORTAL_EXPIRY")).toBe(true);

      const dueDates = items.map((r) => r.dueAt.toISOString());
      expect(dueDates[1]).toBe("2025-01-11T00:00:00.000Z");
    });
  });

  it("creates tenancy reminders and filters by type", () => {
    const tenancyEnd = new Date("2025-06-01T00:00:00Z");
    const reminders = service.scheduleTenancy("user", "listing", tenancyEnd);

    return reminders.then((items) => {
      expect(items).toHaveLength(1);
      expect(items[0].type).toBe<ReminderType>("TENANCY_RENEWAL");
    });
  });

  it("adds ad-hoc reminders", () => {
    return service
      .create("user", {
        type: "LEAD_FOLLOWUP",
        listingId: "listing",
        dueAt: new Date().toISOString(),
        message: "Follow up with owner"
      })
      .then((reminder) => {
        expect(reminder.type).toBe("LEAD_FOLLOWUP");
        expect(reminder.message).toBe("Follow up with owner");
        expect(reminder.status).toBe("PENDING");
      });
  });
});
