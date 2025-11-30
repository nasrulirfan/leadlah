import { describe, beforeEach, expect, it, vi } from "vitest";
import { ProcessController } from "../src/process/process.controller";
import { ProcessService } from "../src/process/process.service";
import { ProcessStage } from "@leadlah/core";

describe("ProcessController", () => {
  let controller: ProcessController;
  let service: ProcessService;

  beforeEach(() => {
    service = {
      logStage: vi.fn(),
      list: vi.fn(),
      ownerLink: vi.fn()
    } as unknown as ProcessService;

    controller = new ProcessController(service);
  });

  it("delegates log/list/owner endpoints", async () => {
    const listingId = "listing";
    const log = { stage: ProcessStage.MARKETING_ACTIVATION };
    vi.spyOn(service, "logStage").mockResolvedValue(log as any);
    vi.spyOn(service, "list").mockResolvedValue([log] as any);
    vi.spyOn(service, "ownerLink").mockResolvedValue({ token: "abc" } as any);

    await expect(controller.log(listingId, { stage: ProcessStage.MARKETING_ACTIVATION, notes: "note" })).resolves.toBe(
      log
    );
    expect(service.logStage).toHaveBeenCalledWith(listingId, {
      stage: ProcessStage.MARKETING_ACTIVATION,
      notes: "note"
    });

    await expect(controller.list(listingId)).resolves.toEqual([log]);
    expect(service.list).toHaveBeenCalledWith(listingId);

    await expect(controller.owner(listingId)).resolves.toEqual({ token: "abc" });
    expect(service.ownerLink).toHaveBeenCalledWith(listingId);
  });
});
