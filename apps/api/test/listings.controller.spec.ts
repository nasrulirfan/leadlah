import { ListingStatus } from "@leadlah/core";
import { describe, beforeEach, expect, it, vi } from "vitest";
import { ListingsController } from "../src/listings/listings.controller";
import { ListingsService } from "../src/listings/listings.service";

describe("ListingsController", () => {
  let controller: ListingsController;
  let service: ListingsService;

  beforeEach(() => {
    service = {
      create: vi.fn(),
      findAll: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      remove: vi.fn()
    } as unknown as ListingsService;

    controller = new ListingsController(service);
  });

  it("routes create requests", async () => {
    const payload = {
      propertyName: "Sunset Villa",
      type: "Condo",
      price: 1000,
      size: 100,
      bedrooms: 2,
      bathrooms: 1,
      location: "SG",
      status: ListingStatus.ACTIVE
    };
    const response = { id: "1", ...payload };
    vi.spyOn(service, "create").mockResolvedValue(response as any);

    await expect(controller.create(payload as any)).resolves.toEqual(response);
    expect(service.create).toHaveBeenCalledWith(payload);
  });

  it("routes read/update/delete operations", async () => {
    vi.spyOn(service, "findAll").mockResolvedValue([]);
    vi.spyOn(service, "findOne").mockResolvedValue({ id: "1" } as any);
    vi.spyOn(service, "update").mockResolvedValue({ id: "1", price: 2 } as any);
    vi.spyOn(service, "remove").mockResolvedValue({ id: "1" });

    await expect(controller.findAll({} as any)).resolves.toEqual([]);
    expect(service.findAll).toHaveBeenCalledWith({});

    await expect(controller.findOne("1")).resolves.toEqual({ id: "1" });
    expect(service.findOne).toHaveBeenCalledWith("1");

    await expect(controller.update("1", { price: 2 } as any)).resolves.toEqual({ id: "1", price: 2 });
    expect(service.update).toHaveBeenCalledWith("1", { price: 2 });

    await expect(controller.remove("1")).resolves.toEqual({ id: "1" });
    expect(service.remove).toHaveBeenCalledWith("1");
  });
});
