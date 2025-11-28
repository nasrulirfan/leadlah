import { Injectable, NotFoundException } from "@nestjs/common";
import { generateOwnerViewToken, ProcessLogEntry, ProcessStage } from "@leadlah/core";

@Injectable()
export class ProcessService {
  private processLogs: Record<string, ProcessLogEntry[]> = {};

  logStage(listingId: string, stage: ProcessStage, notes?: string) {
    const log: ProcessLogEntry = { stage, notes, completedAt: new Date() };
    this.processLogs[listingId] = [...(this.processLogs[listingId] ?? []), log];
    return log;
  }

  list(listingId: string) {
    return this.processLogs[listingId] ?? [];
  }

  ownerLink(listingId: string) {
    if (!this.processLogs[listingId]) {
      throw new NotFoundException("Listing has no process log");
    }
    return generateOwnerViewToken(listingId, 30);
  }
}
