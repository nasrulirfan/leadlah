import { IsOptional, IsString } from "class-validator";

export class DashboardRemindersQueryDto {
  @IsOptional()
  @IsString()
  timeZone?: string;
}
