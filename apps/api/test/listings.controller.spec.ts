import { describe, beforeEach, expect, it, vi } from "vitest";
import { ListingsController } from "../src/listings/listings.controller";
import { ListingsService } from "../src/listings/listings.service";
import { ListingStatus } from "@leadlah/core";

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

  it("routes create requests", () => {
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
    vi.spyOn(service, "create").mockReturnValue(response as any);

    expect(controller.create(payload as any)).toBe(response);
    expect(service.create).toHaveBeenCalledWith(payload);
  });

  it("routes read/update/delete operations", () => {
    vi.spyOn(service, "findAll").mockReturnValue([]);
    vi.spyOn(service, "findOne").mockReturnValue({ id: "1" } as any);
    vi.spyOn(service, "update").mockReturnValue({ id: "1", price: 2 } as any);
    vi.spyOn(service, "remove").mockReturnValue({ id: "1" });

    expect(controller.findAll()).toEqual([]);
    expect(service.findAll).toHaveBeenCalled();

    expect(controller.findOne("1")).toEqual({ id: "1" });
    expect(service.findOne).toHaveBeenCalledWith("1");

    expect(controller.update("1", { price: 2 } as any)).toEqual({ id: "1", price: 2 });
    expect(service.update).toHaveBeenCalledWith("1", { price: 2 });

    expect(controller.remove("1")).toEqual({ id: "1" });
    expect(service.remove).toHaveBeenCalledWith("1");
  });
});
