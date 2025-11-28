import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ProcessService } from "./process.service";
import { ProcessStage } from "@leadlah/core";

@Controller("process")
export class ProcessController {
  constructor(private readonly service: ProcessService) {}

  @Post(":listingId")
  log(@Param("listingId") listingId: string, @Body() body: { stage: ProcessStage; notes?: string }) {
    return this.service.logStage(listingId, body.stage, body.notes);
  }

  @Get(":listingId")
  list(@Param("listingId") listingId: string) {
    return this.service.list(listingId);
  }

  @Get(":listingId/owner-link")
  owner(@Param("listingId") listingId: string) {
    return this.service.ownerLink(listingId);
  }
}
