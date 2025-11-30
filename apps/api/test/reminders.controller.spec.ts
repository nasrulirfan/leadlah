import { describe, beforeEach, expect, it, vi } from "vitest";
import { RemindersController } from "../src/reminders/reminders.controller";
import { RemindersService } from "../src/reminders/reminders.service";

describe("RemindersController", () => {
  let controller: RemindersController;
  let service: RemindersService;

  beforeEach(() => {
    service = {
      list: vi.fn(),
      schedulePortal: vi.fn(),
      scheduleTenancy: vi.fn()
    } as unknown as RemindersService;

    controller = new RemindersController(service);
  });

  it("exposes reminder endpoints", () => {
    vi.spyOn(service, "list").mockReturnValue([]);
    vi.spyOn(service, "schedulePortal").mockReturnValue([{ id: "1" }] as any);
    vi.spyOn(service, "scheduleTenancy").mockReturnValue([{ id: "2" }] as any);

    expect(controller.list()).toEqual([]);
    expect(service.list).toHaveBeenCalledWith(undefined);

    controller.list("PORTAL_EXPIRY" as any);
    expect(service.list).toHaveBeenCalledWith("PORTAL_EXPIRY");

    controller.createPortal("listing", { days: 45 });
    expect(service.schedulePortal).toHaveBeenCalledWith("listing", 45);

    controller.createTenancy("listing", { tenancyEnd: "2025-01-01T00:00:00Z" });
    expect(service.scheduleTenancy).toHaveBeenCalledWith("listing", new Date("2025-01-01T00:00:00Z"));
  });
});
