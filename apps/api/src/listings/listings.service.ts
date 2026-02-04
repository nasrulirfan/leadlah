import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial, Like, Repository } from "typeorm";
import type { ExternalLink, Listing } from "@leadlah/core";
import { ListingCategory, ListingStatus } from "@leadlah/core";
import { ListingEntity } from "./entities/listing.entity";
import { CreateListingDto } from "./dto/create-listing.dto";
import { UpdateListingDto } from "./dto/update-listing.dto";
import { ListListingsQueryDto } from "./dto/list-listings.query";
import { CommissionEntity } from "../performance/entities/commission.entity";

const DEFAULT_SALE_COMMISSION_RATE = 0.03;
const DEFAULT_RENT_COMMISSION_MULTIPLIER = 1;
const AUTO_COMMISSION_NOTE_PREFIX = "Auto-created when listing marked ";

const roundMoney = (value: number) => Math.round(value * 100) / 100;

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(ListingEntity)
    private readonly repository: Repository<ListingEntity>,
    @InjectRepository(CommissionEntity)
    private readonly commissions: Repository<CommissionEntity>,
  ) {}

  private normalizeExternalLinks(links: ExternalLink[] | null | undefined) {
    return (links ?? []).map((link) => ({
      ...link,
      expiresAt: link.expiresAt ?? undefined,
    }));
  }

  private toListing(entity: ListingEntity): Listing {
    return {
      id: entity.id,
      propertyName: entity.propertyName,
      lotUnitNo: entity.lotUnitNo ?? undefined,
      type: entity.type,
      category: entity.category,
      price: Number(entity.price),
      bankValue: entity.bankValue == null ? undefined : Number(entity.bankValue),
      competitorPriceRange: entity.competitorPriceRange ?? undefined,
      size: Number(entity.size),
      bedrooms: entity.bedrooms,
      bathrooms: entity.bathrooms,
      location: entity.location,
      buildingProject: entity.buildingProject ?? undefined,
      status: entity.status,
      expiresAt: entity.expiresAt ?? undefined,
      lastEnquiryAt: entity.lastEnquiryAt ?? undefined,
      photos: entity.photos ?? [],
      videos: entity.videos ?? [],
      documents: entity.documents ?? [],
      externalLinks: this.normalizeExternalLinks(entity.externalLinks),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private resolveCategory(payload: {
    category?: ListingCategory;
    status?: ListingStatus;
  }) {
    if (payload.category) {
      return payload.category;
    }
    if (payload.status === ListingStatus.SOLD) {
      return ListingCategory.SOLD;
    }
    if (payload.status === ListingStatus.RENTED) {
      return ListingCategory.RENTED;
    }
    return ListingCategory.FOR_SALE;
  }

  private parseEnvNumber(key: string) {
    const raw = process.env[key];
    if (!raw) {
      return null;
    }
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  }

  private calculateCommissionAmount(listing: ListingEntity) {
    if (listing.status === ListingStatus.SOLD) {
      const rate = this.parseEnvNumber("SALE_COMMISSION_RATE") ?? DEFAULT_SALE_COMMISSION_RATE;
      return roundMoney(Number(listing.price) * rate);
    }

    if (listing.status === ListingStatus.RENTED) {
      const multiplier =
        this.parseEnvNumber("RENT_COMMISSION_MULTIPLIER") ?? DEFAULT_RENT_COMMISSION_MULTIPLIER;
      return roundMoney(Number(listing.price) * multiplier);
    }

    return 0;
  }

  private isAutoCommission(entity: CommissionEntity) {
    return Boolean(entity.notes && entity.notes.startsWith(AUTO_COMMISSION_NOTE_PREFIX));
  }

  private async upsertAutoCommission(params: { userId: string; listing: ListingEntity }) {
    const existing = await this.commissions.findOne({
      where: { userId: params.userId, listingId: params.listing.id },
    });

    if (existing) {
      if (!this.isAutoCommission(existing)) {
        return existing;
      }

      existing.amount = this.calculateCommissionAmount(params.listing);
      existing.closedDate = new Date();
      existing.notes = `${AUTO_COMMISSION_NOTE_PREFIX}${params.listing.status}.`;
      return this.commissions.save(existing);
    }

    const amount = this.calculateCommissionAmount(params.listing);
    const entity = this.commissions.create({
      userId: params.userId,
      listingId: params.listing.id,
      amount,
      closedDate: new Date(),
      notes: `${AUTO_COMMISSION_NOTE_PREFIX}${params.listing.status}.`,
    });

    return this.commissions.save(entity);
  }

  private async deleteAutoCommission(params: { userId: string; listingId: string }) {
    await this.commissions.delete({
      userId: params.userId,
      listingId: params.listingId,
      notes: Like(`${AUTO_COMMISSION_NOTE_PREFIX}%`),
    });
  }

  async create(payload: CreateListingDto) {
    const entityData: DeepPartial<ListingEntity> = {
      ...payload,
      category: this.resolveCategory(payload),
      status: payload.status ?? ListingStatus.ACTIVE,
      photos: payload.photos ?? [],
      videos: payload.videos ?? [],
      documents: payload.documents ?? [],
      externalLinks: payload.externalLinks ?? [],
    };
    const entity = this.repository.create(entityData);
    const saved = await this.repository.save(entity);
    return this.toListing(saved);
  }

  async findAll(filters: ListListingsQueryDto = {}) {
    const hasFilters = Object.values(filters).some(
      (value) => value != null && value !== "",
    );
    if (!hasFilters) {
      const items = await this.repository.find({ order: { createdAt: "DESC" } });
      return items.map((item) => this.toListing(item));
    }

    const query = this.repository
      .createQueryBuilder("listing")
      .orderBy("listing.createdAt", "DESC");

    if (filters.category) {
      query.andWhere("listing.category = :category", {
        category: filters.category,
      });
    }
    if (filters.status) {
      query.andWhere("listing.status = :status", { status: filters.status });
    }
    if (filters.location) {
      query.andWhere("listing.location ILIKE :location", {
        location: `%${filters.location}%`,
      });
    }
    if (filters.buildingProject) {
      query.andWhere("listing.buildingProject ILIKE :buildingProject", {
        buildingProject: `%${filters.buildingProject}%`,
      });
    }
    if (filters.propertyType) {
      query.andWhere("listing.type ILIKE :type", {
        type: `%${filters.propertyType}%`,
      });
    }
    if (filters.minPrice != null) {
      query.andWhere("listing.price >= :minPrice", {
        minPrice: filters.minPrice,
      });
    }
    if (filters.maxPrice != null) {
      query.andWhere("listing.price <= :maxPrice", {
        maxPrice: filters.maxPrice,
      });
    }
    if (filters.noEnquiryDays != null) {
      const threshold = new Date(
        Date.now() - filters.noEnquiryDays * 24 * 60 * 60 * 1000,
      );
      query.andWhere(
        "(listing.lastEnquiryAt IS NULL OR listing.lastEnquiryAt < :threshold)",
        { threshold },
      );
    }
    if (filters.expiringInDays != null) {
      const now = new Date();
      const expiresBefore = new Date(
        now.getTime() + filters.expiringInDays * 24 * 60 * 60 * 1000,
      );
      query.andWhere("listing.expiresAt IS NOT NULL");
      query.andWhere(
        "listing.expiresAt >= :now AND listing.expiresAt <= :expiresBefore",
        {
          now,
          expiresBefore,
        },
      );
    }

    const items = await query.getMany();
    return items.map((item) => this.toListing(item));
  }

  async findOne(id: string) {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException("Listing not found");
    }
    return this.toListing(entity);
  }

  async update(id: string, payload: UpdateListingDto) {
    const { actorUserId, ...updates } = payload;
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException("Listing not found");
    }

    const previousStatus = entity.status;
    const derivedCategory =
      updates.category ??
      (updates.status === ListingStatus.SOLD
        ? ListingCategory.SOLD
        : updates.status === ListingStatus.RENTED
          ? ListingCategory.RENTED
          : undefined);

    Object.assign(entity, {
      ...updates,
      ...(derivedCategory ? { category: derivedCategory } : {}),
      updatedAt: new Date(),
    } as DeepPartial<ListingEntity>);

    const saved = await this.repository.save(entity);

    const statusChanged = updates.status != null && saved.status !== previousStatus;
    const isClosedStatus =
      saved.status === ListingStatus.SOLD || saved.status === ListingStatus.RENTED;
    if (statusChanged && isClosedStatus && actorUserId) {
      await this.upsertAutoCommission({ userId: actorUserId, listing: saved });
    }

    if (statusChanged && !isClosedStatus && actorUserId) {
      await this.deleteAutoCommission({ userId: actorUserId, listingId: saved.id });
    }

    return this.toListing(saved);
  }

  async remove(id: string) {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException("Listing not found");
    }
    await this.repository.remove(entity);
    return { id };
  }

  async statusCounts(): Promise<Record<string, number>> {
    const rows = await this.repository
      .createQueryBuilder("listing")
      .select("listing.status", "status")
      .addSelect("COUNT(*)", "count")
      .groupBy("listing.status")
      .getRawMany<{ status: string; count: string }>();

    return rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = Number(row.count ?? 0);
      return acc;
    }, {});
  }
}
