import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { LeadsService } from "./leads.service";
import { CreateLeadDto } from "./dto/create-lead.dto";
import { UpdateLeadDto } from "./dto/update-lead.dto";
import { ListLeadsQueryDto } from "./dto/list-leads.query";

@Controller("leads")
export class LeadsController {
  constructor(private readonly service: LeadsService) {}

  @Get(":userId")
  list(@Param("userId") userId: string, @Query() query: ListLeadsQueryDto) {
    return this.service.list(userId, query);
  }

  @Post(":userId")
  create(@Param("userId") userId: string, @Body() body: CreateLeadDto) {
    return this.service.create(userId, body);
  }

  @Patch(":userId/:id")
  update(
    @Param("userId") userId: string,
    @Param("id") id: string,
    @Body() body: UpdateLeadDto,
  ) {
    return this.service.update(userId, id, body);
  }

  @Delete(":userId/:id")
  delete(@Param("userId") userId: string, @Param("id") id: string) {
    return this.service.delete(userId, id);
  }
}
