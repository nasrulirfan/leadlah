import { ListingStatus } from "@leadlah/core";
import { describe, beforeEach, expect, it, vi } from "vitest";
import { ListingsController } from "../src/listings/listings.controller";
import { ListingsService } from "../src/listings/listings.service";
import { ListingPhotosService } from "../src/listings/photos/listing-photos.service";

describe("ListingsController", () => {
  let controller: ListingsController;
  let service: ListingsService;
  let photos: ListingPhotosService;

  beforeEach(() => {
    service = {
      statusCounts: vi.fn(),
      create: vi.fn(),
      findAll: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    } as unknown as ListingsService;

    photos = {
      createUploadUrls: vi.fn(),
      ingestStagedPhotos: vi.fn(),
      getDownloadUrl: vi.fn(),
      reorderPhotos: vi.fn(),
      deletePhoto: vi.fn(),
      replacePhoto: vi.fn(),
      getZipPlan: vi.fn(),
    } as unknown as ListingPhotosService;

    controller = new ListingsController(service, photos);
  });

  it("routes status counts", async () => {
    vi.spyOn(service, "statusCounts").mockResolvedValue({ Active: 2 } as any);

    await expect(controller.statusCounts()).resolves.toEqual({ Active: 2 });
    expect(service.statusCounts).toHaveBeenCalled();
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
      status: ListingStatus.ACTIVE,
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

    await expect(controller.update("1", { price: 2 } as any)).resolves.toEqual({
      id: "1",
      price: 2,
    });
    expect(service.update).toHaveBeenCalledWith("1", { price: 2 });

    await expect(controller.remove("1")).resolves.toEqual({ id: "1" });
    expect(service.remove).toHaveBeenCalledWith("1");
  });

  it("routes photo upload/ingest operations", async () => {
    vi.spyOn(photos, "createUploadUrls").mockResolvedValue({ uploads: [] } as any);
    vi.spyOn(photos, "ingestStagedPhotos").mockResolvedValue({ id: "1", photos: [] } as any);

    await expect(
      controller.createPhotoUploadUrls("1", { files: [] } as any),
    ).resolves.toEqual({ uploads: [] });
    expect(photos.createUploadUrls).toHaveBeenCalledWith({ listingId: "1", files: [] });

    await expect(controller.ingestPhotos("1", { stagedKeys: [] } as any)).resolves.toEqual({
      id: "1",
      photos: [],
    });
    expect(photos.ingestStagedPhotos).toHaveBeenCalledWith({ listingId: "1", stagedKeys: [] });
  });

  it("routes photo management operations", async () => {
    vi.spyOn(photos, "getDownloadUrl").mockResolvedValue({ url: "u" } as any);
    vi.spyOn(photos, "reorderPhotos").mockResolvedValue({ id: "1" } as any);
    vi.spyOn(photos, "deletePhoto").mockResolvedValue({ id: "1" } as any);
    vi.spyOn(photos, "replacePhoto").mockResolvedValue({ id: "1" } as any);

    await expect(controller.photoDownloadUrl("1", "p1")).resolves.toEqual({ url: "u" });
    expect(photos.getDownloadUrl).toHaveBeenCalledWith({ listingId: "1", photoId: "p1" });

    await expect(controller.reorderPhotos("1", { photoIds: ["a"] } as any)).resolves.toEqual({
      id: "1",
    });
    expect(photos.reorderPhotos).toHaveBeenCalledWith({ listingId: "1", photoIds: ["a"] });

    await expect(controller.deletePhoto("1", "a")).resolves.toEqual({ id: "1" });
    expect(photos.deletePhoto).toHaveBeenCalledWith({ listingId: "1", photoId: "a" });

    await expect(
      controller.replacePhoto("1", "a", { stagedKey: "k" } as any),
    ).resolves.toEqual({ id: "1" });
    expect(photos.replacePhoto).toHaveBeenCalledWith({ listingId: "1", photoId: "a", stagedKey: "k" });
  });
});
