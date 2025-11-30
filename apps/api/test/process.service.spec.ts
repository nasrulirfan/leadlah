import { NotFoundException } from "@nestjs/common";
import { describe, beforeEach, expect, it, vi } from "vitest";
import { ProcessService } from "../src/process/process.service";
import * as core from "@leadlah/core";

vi.mock("@leadlah/core", async () => {
  const actual = await vi.importActual<typeof import("@leadlah/core")>("@leadlah/core");
  return {
    ...actual,
    generateOwnerViewToken: vi.fn().mockReturnValue({
      listingId: "listing",
      token: "token",
      expiresAt: new Date("2025-01-01T00:00:00Z")
    })
  };
});

const { ProcessStage, generateOwnerViewToken } = core;

describe("ProcessService", () => {
  let service: ProcessService;

  beforeEach(() => {
    service = new ProcessService();
  });

  it("logs process stages and lists them", () => {
    const log = service.logStage("listing", ProcessStage.OFFER_STAGE, "Offer sent");
    expect(log.stage).toBe(ProcessStage.OFFER_STAGE);
    expect(service.list("listing")).toHaveLength(1);
  });

  it("generates owner link when logs exist", () => {
    service.logStage("listing", ProcessStage.OFFER_STAGE);
    const token = service.ownerLink("listing");

    expect(generateOwnerViewToken).toHaveBeenCalledWith("listing", 30);
    expect(token).toEqual({
      listingId: "listing",
      token: "token",
      expiresAt: new Date("2025-01-01T00:00:00Z")
    });
  });

  it("throws when owner link requested without logs", () => {
    expect(() => service.ownerLink("missing")).toThrow(NotFoundException);
  });
});
