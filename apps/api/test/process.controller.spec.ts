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

  it("delegates log/list/owner endpoints", () => {
    const listingId = "listing";
    const log = { stage: ProcessStage.MARKETING_ACTIVATION };
    vi.spyOn(service, "logStage").mockReturnValue(log as any);
    vi.spyOn(service, "list").mockReturnValue([log] as any);
    vi.spyOn(service, "ownerLink").mockReturnValue({ token: "abc" } as any);

    expect(controller.log(listingId, { stage: ProcessStage.MARKETING_ACTIVATION })).toBe(log);
    expect(service.logStage).toHaveBeenCalledWith(listingId, ProcessStage.MARKETING_ACTIVATION, undefined);

    expect(controller.list(listingId)).toEqual([log]);
    expect(service.list).toHaveBeenCalledWith(listingId);

    expect(controller.owner(listingId)).toEqual({ token: "abc" });
    expect(service.ownerLink).toHaveBeenCalledWith(listingId);
  });
});
