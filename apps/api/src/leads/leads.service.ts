import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { LeadEntity } from "./entities/lead.entity";
import { CreateLeadDto } from "./dto/create-lead.dto";
import { UpdateLeadDto } from "./dto/update-lead.dto";
import { ListLeadsQueryDto } from "./dto/list-leads.query";

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(LeadEntity)
    private readonly leads: Repository<LeadEntity>,
  ) {}

  async list(userId: string, query: ListLeadsQueryDto = {}) {
    const limit = query.limit ?? 250;
    const where = query.status ? { userId, status: query.status } : { userId };
    return this.leads.find({
      where,
      order: { createdAt: "DESC" },
      take: limit,
    });
  }

  async create(userId: string, payload: CreateLeadDto) {
    const entity = this.leads.create({
      userId,
      listingId: payload.listingId ?? null,
      name: payload.name,
      phone: payload.phone ?? null,
      email: payload.email ?? null,
      source: payload.source ?? "manual",
      status: payload.status ?? "NEW",
      message: payload.message ?? null,
      lastContactedAt: null,
    });
    return this.leads.save(entity);
  }

  async update(userId: string, id: string, payload: UpdateLeadDto) {
    const entity = await this.leads.findOne({ where: { id, userId } });
    if (!entity) {
      throw new NotFoundException("Lead not found");
    }

    if (payload.listingId !== undefined) {
      entity.listingId = payload.listingId ?? null;
    }
    if (payload.name != null) {
      entity.name = payload.name;
    }
    if (payload.phone !== undefined) {
      entity.phone = payload.phone ?? null;
    }
    if (payload.email !== undefined) {
      entity.email = payload.email ?? null;
    }
    if (payload.source != null) {
      entity.source = payload.source;
    }
    if (payload.status != null) {
      entity.status = payload.status;
      if (payload.status !== "NEW") {
        entity.lastContactedAt = new Date();
      }
    }
    if (payload.message !== undefined) {
      entity.message = payload.message ?? null;
    }

    return this.leads.save(entity);
  }

  async delete(userId: string, id: string) {
    const result = await this.leads.delete({ id, userId });
    if (!result.affected) {
      throw new NotFoundException("Lead not found");
    }
    return { id };
  }
}

