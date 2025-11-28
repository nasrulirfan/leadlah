import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { CreateListingDto } from "./dto/create-listing.dto";
import { UpdateListingDto } from "./dto/update-listing.dto";
import { ListingStatus } from "@leadlah/core";

type ListingRecord = CreateListingDto & { id: string; createdAt: Date; updatedAt: Date };

@Injectable()
export class ListingsService {
  // TODO: replace with TypeORM repository; using in-memory store for MVP scaffolding
  private listings: ListingRecord[] = [];

  create(payload: CreateListingDto) {
    const record: ListingRecord = {
      ...payload,
      id: randomUUID(),
      status: payload.status ?? ListingStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.listings.push(record);
    return record;
  }

  findAll() {
    return this.listings;
  }

  findOne(id: string) {
    const record = this.listings.find((l) => l.id === id);
    if (!record) throw new NotFoundException("Listing not found");
    return record;
  }

  update(id: string, payload: UpdateListingDto) {
    const existing = this.findOne(id);
    const updated = { ...existing, ...payload, updatedAt: new Date() };
    this.listings = this.listings.map((l) => (l.id === id ? updated : l));
    return updated;
  }

  remove(id: string) {
    this.findOne(id);
    this.listings = this.listings.filter((l) => l.id !== id);
    return { id };
  }
}
