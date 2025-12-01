import { NotFoundException } from "@nestjs/common";
import { describe, beforeEach, expect, it, vi } from "vitest";
import { ProcessService } from "../src/process/process.service";
import * as core from "@leadlah/core";
import { ProcessLogEntity } from "../src/process/entities/process-log.entity";
import type { Repository } from "typeorm";

process.env.OWNER_LINK_SECRET = "test-owner-link-secret";

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

const createRepositoryMock = () => {
  const repo: Partial<Repository<ProcessLogEntity>> = {
    findOne: vi.fn().mockResolvedValue(null),
    create: vi.fn((data: Partial<ProcessLogEntity>) => ({ id: "log-id", ...data } as ProcessLogEntity)),
    save: vi.fn(async (entity: ProcessLogEntity) => entity),
    find: vi.fn(),
    count: vi.fn()
  };
  return repo;
};

describe("ProcessService", () => {
  let service: ProcessService;
  let repository: ReturnType<typeof createRepositoryMock>;

  beforeEach(() => {
    repository = createRepositoryMock();
    service = new ProcessService(repository as Repository<ProcessLogEntity>);
  });

  it("logs process stages and lists them", async () => {
    (repository.find as any).mockResolvedValue([
      { stage: ProcessStage.OFFER_STAGE, completedAt: new Date("2024-01-01T00:00:00Z") }
    ]);
    const log = await service.logStage("listing", { stage: ProcessStage.OFFER_STAGE, notes: "Offer sent" });
    expect(log.stage).toBe(ProcessStage.OFFER_STAGE);
    const list = await service.list("listing");
    expect(repository.create).toHaveBeenCalledWith({ listingId: "listing", stage: ProcessStage.OFFER_STAGE });
    expect(list).toHaveLength(1);
  });

  it("generates owner link when logs exist", async () => {
    (repository.count as any).mockResolvedValue(1);
    const token = await service.ownerLink("listing");

    expect(generateOwnerViewToken).toHaveBeenCalledWith("listing", 30, "test-owner-link-secret");
    expect(token).toEqual({
      listingId: "listing",
      token: "token",
      expiresAt: new Date("2025-01-01T00:00:00Z")
    });
  });

  it("throws when owner link requested without logs", async () => {
    (repository.count as any).mockResolvedValue(0);
    await expect(service.ownerLink("missing")).rejects.toThrow(NotFoundException);
  });
});
