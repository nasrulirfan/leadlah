import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { LeadEntity } from "./entities/lead.entity";
import { CreateLeadDto } from "./dto/create-lead.dto";
import { UpdateLeadDto } from "./dto/update-lead.dto";
import { ListLeadsQueryDto } from "./dto/list-leads.query";

const normalizeEmail = (value?: string | null) => {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized.length ? normalized : null;
};

const normalizePhone = (value?: string | null) => {
  const raw = (value ?? "").trim();
  if (!raw) {
    return null;
  }

  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) {
    return null;
  }

  if (digits.startsWith("00")) {
    return digits.slice(2);
  }

  if (digits.startsWith("0") && digits.length >= 9) {
    return `60${digits.slice(1)}`;
  }

  return digits;
};

const statusRank: Record<string, number> = {
  NEW: 0,
  CONTACTED: 1,
  QUALIFIED: 2,
  WON: 3,
  LOST: 3,
};

const shouldAdvanceStatus = (
  current: string | null | undefined,
  next: string,
) => {
  const currentRank = current ? (statusRank[current] ?? 0) : 0;
  return (statusRank[next] ?? 0) > currentRank;
};

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
      relations: { listing: true },
      order: { createdAt: "DESC" },
      take: limit,
    });
  }

  async create(userId: string, payload: CreateLeadDto) {
    const phoneNormalized = normalizePhone(payload.phone ?? null);
    const emailNormalized = normalizeEmail(payload.email ?? null);
    const entity = this.leads.create({
      userId,
      listingId: payload.listingId ?? null,
      name: payload.name,
      phone: payload.phone ?? null,
      phoneNormalized,
      email: payload.email ?? null,
      emailNormalized,
      source: payload.source ?? "manual",
      status: payload.status ?? "NEW",
      message: payload.message ?? null,
      lastContactedAt: null,
    });
    const saved = await this.leads.save(entity);
    return (
      (await this.leads.findOne({
        where: { id: saved.id, userId },
        relations: { listing: true },
      })) ?? saved
    );
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
      entity.phoneNormalized = normalizePhone(payload.phone ?? null);
    }
    if (payload.email !== undefined) {
      entity.email = payload.email ?? null;
      entity.emailNormalized = normalizeEmail(payload.email ?? null);
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

    const saved = await this.leads.save(entity);
    return (
      (await this.leads.findOne({
        where: { id, userId },
        relations: { listing: true },
      })) ?? saved
    );
  }

  private isContactConflict(params: {
    phoneNormalized: string | null;
    emailNormalized: string | null;
    existing: LeadEntity;
  }) {
    const { phoneNormalized, emailNormalized, existing } = params;

    if (
      phoneNormalized &&
      existing.phoneNormalized &&
      phoneNormalized === existing.phoneNormalized &&
      emailNormalized &&
      existing.emailNormalized &&
      emailNormalized !== existing.emailNormalized
    ) {
      return true;
    }

    if (
      emailNormalized &&
      existing.emailNormalized &&
      emailNormalized === existing.emailNormalized &&
      phoneNormalized &&
      existing.phoneNormalized &&
      phoneNormalized !== existing.phoneNormalized
    ) {
      return true;
    }

    return false;
  }

  async upsertFromViewing(params: {
    userId: string;
    listingId: string;
    customer: {
      name: string;
      phone?: string;
      email?: string;
      notes?: string;
    };
  }) {
    const phoneNormalized = normalizePhone(params.customer.phone ?? null);
    const emailNormalized = normalizeEmail(params.customer.email ?? null);
    const canDedupe = Boolean(phoneNormalized || emailNormalized);

    const existing = canDedupe
      ? await this.leads.find({
          where: [
            ...(phoneNormalized
              ? [{ userId: params.userId, phoneNormalized }]
              : []),
            ...(emailNormalized
              ? [{ userId: params.userId, emailNormalized }]
              : []),
          ],
          order: { updatedAt: "DESC" },
          take: 5,
        })
      : [];

    const bestMatch =
      existing.find(
        (lead) =>
          phoneNormalized &&
          emailNormalized &&
          lead.phoneNormalized === phoneNormalized &&
          lead.emailNormalized === emailNormalized,
      ) ?? existing[0];

    if (
      bestMatch &&
      this.isContactConflict({
        phoneNormalized,
        emailNormalized,
        existing: bestMatch,
      })
    ) {
      return this.create(params.userId, {
        listingId: params.listingId,
        name: params.customer.name,
        phone: params.customer.phone ?? null,
        email: params.customer.email ?? null,
        source: "viewing",
        status: "CONTACTED" as any,
        message: params.customer.notes ?? null,
      });
    }

    if (!bestMatch) {
      return this.create(params.userId, {
        listingId: params.listingId,
        name: params.customer.name,
        phone: params.customer.phone ?? null,
        email: params.customer.email ?? null,
        source: "viewing",
        status: "CONTACTED" as any,
        message: params.customer.notes ?? null,
      });
    }

    if (!bestMatch.name?.trim() && params.customer.name.trim()) {
      bestMatch.name = params.customer.name.trim();
    }
    if (bestMatch.phone == null && params.customer.phone) {
      bestMatch.phone = params.customer.phone;
      bestMatch.phoneNormalized = phoneNormalized;
    }
    if (bestMatch.email == null && params.customer.email) {
      bestMatch.email = params.customer.email;
      bestMatch.emailNormalized = emailNormalized;
    }

    if (bestMatch.listingId == null) {
      bestMatch.listingId = params.listingId;
    }

    if (
      params.customer.notes &&
      (bestMatch.message == null || bestMatch.message.trim().length === 0)
    ) {
      bestMatch.message = params.customer.notes;
    }

    if (shouldAdvanceStatus(bestMatch.status, "CONTACTED")) {
      bestMatch.status = "CONTACTED";
    }
    bestMatch.lastContactedAt = new Date();

    const saved = await this.leads.save(bestMatch);
    return (
      (await this.leads.findOne({
        where: { id: saved.id, userId: params.userId },
        relations: { listing: true },
      })) ?? saved
    );
  }

  async delete(userId: string, id: string) {
    const result = await this.leads.delete({ id, userId });
    if (!result.affected) {
      throw new NotFoundException("Lead not found");
    }
    return { id };
  }
}
