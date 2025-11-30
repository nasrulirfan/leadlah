import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial, Repository } from "typeorm";
import { ListingStatus } from "@leadlah/core";
import { ListingEntity } from "./entities/listing.entity";
import { CreateListingDto } from "./dto/create-listing.dto";
import { UpdateListingDto } from "./dto/update-listing.dto";

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(ListingEntity)
    private readonly repository: Repository<ListingEntity>
  ) {}

  async create(payload: CreateListingDto) {
    const entityData: DeepPartial<ListingEntity> = {
      ...payload,
      status: payload.status ?? ListingStatus.ACTIVE,
      photos: payload.photos ?? [],
      videos: payload.videos ?? [],
      documents: payload.documents ?? [],
      externalLinks: payload.externalLinks ?? []
    };
    const entity = this.repository.create(entityData);
    return this.repository.save(entity);
  }

  findAll() {
    return this.repository.find();
  }

  async findOne(id: string) {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException("Listing not found");
    }
    return entity;
  }

  async update(id: string, payload: UpdateListingDto) {
    const entity = await this.repository.preload({
      id,
      ...payload,
      updatedAt: new Date()
    } as DeepPartial<ListingEntity>);
    if (!entity) {
      throw new NotFoundException("Listing not found");
    }
    return this.repository.save(entity);
  }

  async remove(id: string) {
    const entity = await this.findOne(id);
    await this.repository.remove(entity);
    return { id };
  }
}
