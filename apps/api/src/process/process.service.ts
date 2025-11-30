import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { generateOwnerViewToken, ProcessLogEntry, ProcessStage } from "@leadlah/core";
import { ProcessLogEntity } from "./entities/process-log.entity";

type LogStagePayload = {
  stage: ProcessStage;
  notes?: string;
  actor?: string;
  completed?: boolean;
};

@Injectable()
export class ProcessService {
  constructor(
    @InjectRepository(ProcessLogEntity)
    private readonly repository: Repository<ProcessLogEntity>
  ) {}

  private toProcessLog(entity: ProcessLogEntity): ProcessLogEntry {
    return {
      stage: entity.stage,
      notes: entity.notes ?? undefined,
      actor: entity.actor ?? undefined,
      completedAt: entity.completedAt ?? undefined
    };
  }

  async logStage(listingId: string, payload: LogStagePayload) {
    const existing = await this.repository.findOne({ where: { listingId, stage: payload.stage } });
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
    return this.toProcessLog(saved);
  }

  async list(listingId: string) {
    const logs = await this.repository.find({
      where: { listingId },
      order: { createdAt: "ASC" }
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
