import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ProcessService } from "./process.service";
import { LogProcessDto } from "./dto/log-process.dto";

@Controller("process")
export class ProcessController {
  constructor(private readonly service: ProcessService) {}

  @Post(":listingId")
  log(@Param("listingId") listingId: string, @Body() body: LogProcessDto) {
    return this.service.logStage(listingId, body);
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
