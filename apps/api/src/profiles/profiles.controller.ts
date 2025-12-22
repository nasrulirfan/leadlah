import { Body, Controller, Get, Param, Patch, Put } from "@nestjs/common";
import { ProfilesService } from "./profiles.service";
import { UpsertProfileDto } from "./dto/upsert-profile.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Controller("profiles")
export class ProfilesController {
  constructor(private readonly service: ProfilesService) {}

  @Get(":userId")
  get(@Param("userId") userId: string) {
    return this.service.get(userId);
  }

  @Put(":userId")
  upsert(@Param("userId") userId: string, @Body() body: UpsertProfileDto) {
    return this.service.upsert(userId, body);
  }

  @Patch(":userId")
  update(@Param("userId") userId: string, @Body() body: UpdateProfileDto) {
    return this.service.update(userId, body);
  }
}

