import { describe, beforeEach, expect, it, vi } from "vitest";
import { RemindersController } from "../src/reminders/reminders.controller";
import { RemindersService } from "../src/reminders/reminders.service";

describe("RemindersController", () => {
  let controller: RemindersController;
  let service: RemindersService;

  beforeEach(() => {
    service = {
      listLegacy: vi.fn(),
      list: vi.fn(),
      dashboard: vi.fn(),
      create: vi.fn(),
      complete: vi.fn(),
      dismiss: vi.fn(),
      schedulePortal: vi.fn(),
      scheduleTenancy: vi.fn()
    } as unknown as RemindersService;

    controller = new RemindersController(service);
  });

  it("exposes reminder endpoints", () => {
    vi.spyOn(service, "listLegacy").mockReturnValue([] as any);
    vi.spyOn(service, "list").mockResolvedValue([] as any);
    vi.spyOn(service, "dashboard").mockResolvedValue({ today: [], tomorrow: [], thisWeek: [] } as any);
    vi.spyOn(service, "create").mockResolvedValue({ id: "1" } as any);
    vi.spyOn(service, "complete").mockResolvedValue({ id: "2" } as any);
    vi.spyOn(service, "dismiss").mockResolvedValue({ id: "3" } as any);
    vi.spyOn(service, "schedulePortal").mockResolvedValue([{ id: "4" }] as any);
    vi.spyOn(service, "scheduleTenancy").mockResolvedValue([{ id: "5" }] as any);

    expect(controller.listLegacy()).toEqual([]);
    expect(service.listLegacy).toHaveBeenCalledWith(undefined);

    controller.listLegacy("PORTAL_EXPIRY" as any);
    expect(service.listLegacy).toHaveBeenCalledWith("PORTAL_EXPIRY");

    controller.list("user", { status: "PENDING" } as any);
    expect(service.list).toHaveBeenCalledWith("user", { status: "PENDING" });

    controller.dashboard("user", { timeZone: "Asia/Kuala_Lumpur" } as any);
    expect(service.dashboard).toHaveBeenCalledWith("user", "Asia/Kuala_Lumpur");

    controller.create("user", { type: "LEAD_FOLLOWUP", dueAt: new Date().toISOString(), message: "Hi" } as any);
    expect(service.create).toHaveBeenCalled();

    controller.complete("user", "reminder");
    expect(service.complete).toHaveBeenCalledWith("user", "reminder");

    controller.dismiss("user", "reminder");
    expect(service.dismiss).toHaveBeenCalledWith("user", "reminder");

    controller.createPortalForUser("user", "listing", { days: 45 });
    expect(service.schedulePortal).toHaveBeenCalledWith("user", "listing", 45);

    controller.createTenancyForUser("user", "listing", { tenancyEnd: "2025-01-01T00:00:00Z" });
    expect(service.scheduleTenancy).toHaveBeenCalledWith(
      "user",
      "listing",
      new Date("2025-01-01T00:00:00Z")
    );

    controller.createPortal("listing", { userId: "user", days: 45 });
    expect(service.schedulePortal).toHaveBeenCalledWith("user", "listing", 45);

    controller.createTenancy("listing", { userId: "user", tenancyEnd: "2025-01-01T00:00:00Z" });
    expect(service.scheduleTenancy).toHaveBeenCalledWith(
      "user",
      "listing",
      new Date("2025-01-01T00:00:00Z")
    );
  });
});
