import { NotFoundException } from "@nestjs/common";
import { ListingStatus } from "@leadlah/core";
import { describe, expect, it, beforeEach } from "vitest";
import { ListingsService } from "../src/listings/listings.service";
import { CreateListingDto } from "../src/listings/dto/create-listing.dto";

const createPayload = (): CreateListingDto => ({
  propertyName: "Sunset Villa",
  type: "Condo",
  price: 1200000,
  size: 1500,
  bedrooms: 3,
  bathrooms: 2,
  location: "Bukit Timah",
  status: ListingStatus.ACTIVE,
  photos: [],
  videos: [],
  documents: [],
  externalLinks: []
});

describe("ListingsService", () => {
  let service: ListingsService;

  beforeEach(() => {
    service = new ListingsService();
  });

  it("creates a listing with default metadata", () => {
    const listing = service.create(createPayload());

    expect(listing.id).toBeDefined();
    expect(listing.status).toBe(ListingStatus.ACTIVE);
    expect(listing.createdAt).toBeInstanceOf(Date);
    expect(listing.updatedAt).toBeInstanceOf(Date);
    expect(service.findAll()).toHaveLength(1);
  });

  it("retrieves and updates an existing listing", () => {
    const listing = service.create(createPayload());
    const updated = service.update(listing.id, { price: 1250000 });

    expect(updated.price).toBe(1250000);
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(listing.updatedAt.getTime());
    expect(service.findOne(listing.id)).toEqual(updated);
  });

  it("throws when listing is missing", () => {
    expect(() => service.findOne("missing")).toThrow(NotFoundException);
  });

  it("removes a listing", () => {
    const listing = service.create(createPayload());
    const result = service.remove(listing.id);

    expect(result).toEqual({ id: listing.id });
    expect(service.findAll()).toHaveLength(0);
    expect(() => service.findOne(listing.id)).toThrow(NotFoundException);
  });
});
