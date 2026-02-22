import { NotFoundException } from "@nestjs/common";
import { ListingCategory, ListingStatus, ListingTenure } from "@leadlah/core";
import { Repository } from "typeorm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ListingsService } from "../src/listings/listings.service";
import { ListingEntity } from "../src/listings/entities/listing.entity";
import { CommissionEntity } from "../src/performance/entities/commission.entity";
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

type RepositoryMock = Partial<Record<keyof Repository<ListingEntity>, ReturnType<typeof vi.fn>>>;
type CommissionRepositoryMock = Partial<
  Record<keyof Repository<CommissionEntity>, ReturnType<typeof vi.fn>>
>;

const createRepositoryMock = (): RepositoryMock => ({
  create: vi.fn(),
  save: vi.fn(),
  find: vi.fn(),
  createQueryBuilder: vi.fn(),
  findOne: vi.fn(),
  remove: vi.fn()
});

const createCommissionRepositoryMock = (): CommissionRepositoryMock => ({
  create: vi.fn(),
  delete: vi.fn(),
  save: vi.fn(),
  findOne: vi.fn()
});

describe("ListingsService", () => {
  let service: ListingsService;
  let repository: RepositoryMock;
  let commissions: CommissionRepositoryMock;

  beforeEach(() => {
    repository = createRepositoryMock();
    commissions = createCommissionRepositoryMock();
    service = new ListingsService(
      repository as unknown as Repository<ListingEntity>,
      commissions as unknown as Repository<CommissionEntity>
    );
  });

  it("creates a listing with defaults", async () => {
    const payload = createPayload();
    repository.create!.mockImplementation((data) => ({ id: "1", ...(data as any) }));
    repository.save!.mockImplementation(async (entity) => entity as any);

    const listing = await service.create(payload);

    expect(repository.create).toHaveBeenCalledWith({
      ...payload,
      category: ListingCategory.FOR_SALE,
      documents: [],
      externalLinks: [],
      photos: [],
      status: ListingStatus.ACTIVE,
      videos: []
    });
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: "1", category: ListingCategory.FOR_SALE })
    );
    expect(listing).toEqual({
      id: "1",
      propertyName: payload.propertyName,
      lotUnitNo: undefined,
      type: payload.type,
      category: ListingCategory.FOR_SALE,
      tenure: ListingTenure.FREEHOLD,
      price: payload.price,
      bankValue: undefined,
      competitorPriceRange: undefined,
      size: payload.size,
      bedrooms: payload.bedrooms,
      bathrooms: payload.bathrooms,
      location: payload.location,
      buildingProject: undefined,
      status: payload.status,
      expiresAt: undefined,
      lastEnquiryAt: undefined,
      photos: payload.photos,
      videos: payload.videos,
      documents: payload.documents,
      externalLinks: payload.externalLinks,
      createdAt: undefined,
      updatedAt: undefined,
    });
  });

  it("retrieves all listings", async () => {
    repository.find!.mockResolvedValue([{ id: "1" } as ListingEntity]);

    const listings = await service.findAll();

    expect(listings).toHaveLength(1);
    expect(repository.find).toHaveBeenCalledWith({ order: { createdAt: "DESC" } });
  });

  it("finds an existing listing", async () => {
    repository.findOne!.mockResolvedValue({ id: "abc" } as ListingEntity);

    const listing = await service.findOne("abc");

    expect(listing.id).toBe("abc");
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: "abc" } });
  });

  it("throws when listing not found", async () => {
    repository.findOne!.mockResolvedValue(null);

    await expect(service.findOne("missing")).rejects.toThrow(NotFoundException);
  });

  it("updates a listing", async () => {
    const existing = { id: "1", price: 1000, status: ListingStatus.ACTIVE } as ListingEntity;
    repository.findOne!.mockResolvedValue(existing);
    repository.save!.mockResolvedValue({ ...existing, price: 1500 });

    const updated = await service.update("1", { price: 1500 });

    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: "1" } });
    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ id: "1", price: 1500 }));
    expect(commissions.findOne).not.toHaveBeenCalled();
    expect(updated.price).toBe(1500);
  });

  it("creates a commission when listing is marked sold", async () => {
    const existing = { id: "1", price: 100000, status: ListingStatus.ACTIVE } as ListingEntity;
    repository.findOne!.mockResolvedValue(existing);
    repository.save!.mockResolvedValue({ ...existing, status: ListingStatus.SOLD } as ListingEntity);

    commissions.findOne!.mockResolvedValue(null);
    commissions.create!.mockImplementation((payload) => payload as any);
    commissions.save!.mockImplementation(async (entity) => entity as any);

    await service.update("1", { status: ListingStatus.SOLD, actorUserId: "user-1" } as any);

    expect(commissions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        listingId: "1",
        amount: 3000,
        closedDate: expect.any(Date),
        notes: expect.stringContaining("Sold")
      })
    );
    expect(commissions.save).toHaveBeenCalled();
  });

  it("updates the auto-commission when listing status changes between sold and rented", async () => {
    const existing = { id: "1", price: 2500, status: ListingStatus.SOLD } as ListingEntity;
    repository.findOne!.mockResolvedValue(existing);
    repository.save!.mockResolvedValue({ ...existing, status: ListingStatus.RENTED } as ListingEntity);

    const autoCommission = {
      id: "c1",
      userId: "user-1",
      listingId: "1",
      amount: 75,
      closedDate: new Date("2024-01-01"),
      notes: "Auto-created when listing marked Sold."
    };
    commissions.findOne!.mockResolvedValue(autoCommission as any);
    commissions.save!.mockImplementation(async (entity) => entity as any);

    await service.update("1", { status: ListingStatus.RENTED, actorUserId: "user-1" } as any);

    expect(commissions.create).not.toHaveBeenCalled();
    expect(commissions.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "c1",
        amount: 2500,
        notes: expect.stringContaining("Rented")
      })
    );
  });

  it("creates a commission when listing is marked rented", async () => {
    const existing = { id: "1", price: 2500, status: ListingStatus.ACTIVE } as ListingEntity;
    repository.findOne!.mockResolvedValue(existing);
    repository.save!.mockResolvedValue({ ...existing, status: ListingStatus.RENTED } as ListingEntity);

    commissions.findOne!.mockResolvedValue(null);
    commissions.create!.mockImplementation((payload) => payload as any);
    commissions.save!.mockImplementation(async (entity) => entity as any);

    await service.update("1", { status: ListingStatus.RENTED, actorUserId: "user-1" } as any);

    expect(commissions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        listingId: "1",
        amount: 2500
      })
    );
    expect(commissions.save).toHaveBeenCalled();
  });

  it("removes the auto-commission when listing is reverted from sold/rented", async () => {
    const existing = { id: "1", price: 100000, status: ListingStatus.SOLD } as ListingEntity;
    repository.findOne!.mockResolvedValue(existing);
    repository.save!.mockResolvedValue({ ...existing, status: ListingStatus.ACTIVE } as ListingEntity);

    await service.update("1", { status: ListingStatus.ACTIVE, actorUserId: "user-1" } as any);

    expect(commissions.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        listingId: "1"
      })
    );
  });

  it("does not create a commission without an actor user id", async () => {
    const existing = { id: "1", price: 100000, status: ListingStatus.ACTIVE } as ListingEntity;
    repository.findOne!.mockResolvedValue(existing);
    repository.save!.mockResolvedValue({ ...existing, status: ListingStatus.SOLD } as ListingEntity);

    await service.update("1", { status: ListingStatus.SOLD } as any);

    expect(commissions.create).not.toHaveBeenCalled();
    expect(commissions.save).not.toHaveBeenCalled();
  });

  it("removes a listing", async () => {
    const entity = { id: "1" } as ListingEntity;
    repository.findOne!.mockResolvedValue(entity);
    repository.remove!.mockResolvedValue(entity);

    const result = await service.remove("1");

    expect(repository.remove).toHaveBeenCalledWith(entity);
    expect(result).toEqual({ id: "1" });
  });
});
