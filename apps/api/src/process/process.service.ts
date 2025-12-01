import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { generateOwnerViewToken, ProcessLogEntry, ProcessStage, ViewingCustomer } from "@leadlah/core";
import { ProcessLogEntity } from "./entities/process-log.entity";
import { ProcessViewingEntity } from "./entities/process-viewing.entity";

type ViewingPayload = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  viewedAt?: Date | string;
};

type LogStagePayload = {
  stage: ProcessStage;
  notes?: string;
  actor?: string;
  completed?: boolean;
  viewings?: ViewingPayload[];
  successfulBuyerId?: string;
};

@Injectable()
export class ProcessService {
  constructor(
    @InjectRepository(ProcessLogEntity)
    private readonly repository: Repository<ProcessLogEntity>,
    @InjectRepository(ProcessViewingEntity)
    private readonly viewingRepository: Repository<ProcessViewingEntity>
  ) {}

  private toViewingCustomer(entity: ProcessViewingEntity): ViewingCustomer {
    return {
      id: entity.id,
      name: entity.name,
      phone: entity.phone ?? undefined,
      email: entity.email ?? undefined,
      notes: entity.notes ?? undefined,
      viewedAt: entity.viewedAt ?? undefined
    };
  }

  private toProcessLog(entity: ProcessLogEntity): ProcessLogEntry {
    const viewings = entity.viewings?.length
      ? [...entity.viewings].sort((a, b) => {
          const left = a.viewedAt?.getTime() ?? 0;
          const right = b.viewedAt?.getTime() ?? 0;
          if (left === right) {
            return a.createdAt.getTime() - b.createdAt.getTime();
          }
          return left - right;
        })
      : undefined;
    const successfulBuyerId = viewings?.find((viewing) => viewing.isSuccessfulBuyer)?.id;
    return {
      stage: entity.stage,
      notes: entity.notes ?? undefined,
      actor: entity.actor ?? undefined,
      completedAt: entity.completedAt ?? undefined,
      viewings: viewings?.map((viewing) => this.toViewingCustomer(viewing)),
      successfulBuyerId
    };
  }

  private normalizeText(value?: string | null) {
    if (!value) {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }

  private toDateOrNull(value?: Date | string) {
    if (!value) {
      return null;
    }
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private async syncViewings(
    listingId: string,
    processLogId: string,
    viewings: ViewingPayload[] = [],
    successfulBuyerId?: string
  ): Promise<ProcessViewingEntity[]> {
    const existing = await this.viewingRepository.find({ where: { processLogId } });
    const existingMap = new Map(existing.map((viewing) => [viewing.id, viewing]));
    const payloadIds = new Set(viewings.map((viewing) => viewing.id).filter((id): id is string => Boolean(id)));

    for (const payload of viewings) {
      const name = payload.name.trim();
      if (!name) {
        throw new BadRequestException("Viewing name is required.");
      }
      const phone = this.normalizeText(payload.phone);
      const email = this.normalizeText(payload.email);
      const notes = this.normalizeText(payload.notes);
      const viewedAt = this.toDateOrNull(payload.viewedAt);
      const target = existingMap.get(payload.id);
      if (target) {
        target.name = name;
        target.phone = phone ?? null;
        target.email = email ?? null;
        target.notes = notes ?? null;
        target.viewedAt = viewedAt;
        target.isSuccessfulBuyer = payload.id === successfulBuyerId;
        const saved = await this.viewingRepository.save(target);
      } else {
        const created = this.viewingRepository.create({
          listingId,
          processLogId,
          name,
          phone: phone ?? null,
          email: email ?? null,
          notes: notes ?? null,
          viewedAt,
          isSuccessfulBuyer: payload.id === successfulBuyerId
        });
        await this.viewingRepository.save(created);
      }
    }

    const idsToRemove = existing.filter((viewing) => !payloadIds.has(viewing.id)).map((viewing) => viewing.id);
    if (idsToRemove.length) {
      await this.viewingRepository.delete(idsToRemove);
    }
    if (successfulBuyerId && !payloadIds.has(successfulBuyerId)) {
      throw new BadRequestException("Selected buyer must be part of the viewing list.");
    }

    const latest = await this.viewingRepository.find({
      where: { processLogId },
      order: { viewedAt: "ASC", createdAt: "ASC" }
    });

    return latest;
  }

  async logStage(listingId: string, payload: LogStagePayload) {
    const existing = await this.repository.findOne({
      where: { listingId, stage: payload.stage },
      relations: { viewings: true }
    });
    const entity = existing ?? this.repository.create({ listingId, stage: payload.stage });

    if (payload.notes !== undefined) {
      entity.notes = payload.notes;
    }
    if (payload.actor !== undefined) {
      entity.actor = payload.actor;
    }

    if (typeof payload.completed === "boolean") {
      entity.completedAt = payload.completed ? new Date() : null;
    } else if (!existing) {
      entity.completedAt = new Date();
    }

    const saved = await this.repository.save(entity);

    if (payload.stage === ProcessStage.VIEWING_RECORD) {
      if (!payload.viewings || payload.viewings.length === 0) {
        throw new BadRequestException("Viewing records cannot be empty for the viewing stage.");
      }
      const viewingSync = await this.syncViewings(saved.listingId, saved.id, payload.viewings, payload.successfulBuyerId);
      saved.viewings = viewingSync;
    } else if (payload.viewings || payload.successfulBuyerId) {
      throw new BadRequestException("Viewing records may only be attached to the viewing stage.");
    }

    const withRelations = await this.repository.findOne({
      where: { id: saved.id },
      relations: { viewings: true }
    });

    return this.toProcessLog(withRelations ?? saved);
  }

  async list(listingId: string) {
    const logs = await this.repository.find({
      where: { listingId },
      order: { createdAt: "ASC" },
      relations: { viewings: true }
    });
    return logs.map((entry) => this.toProcessLog(entry));
  }

  async ownerLink(listingId: string) {
    const count = await this.repository.count({ where: { listingId } });
    if (count === 0) {
      throw new NotFoundException("Listing has no process log");
    }
    return generateOwnerViewToken(listingId, 30);
  }
}
