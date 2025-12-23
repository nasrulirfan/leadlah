import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import type { ReminderStatus } from "../entities/reminder.entity";

export class ListRemindersQueryDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsIn(["PENDING", "DONE", "DISMISSED"])
  status?: ReminderStatus;

  @IsOptional()
  @IsString()
  dueBefore?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(250)
  @Type(() => Number)
  limit?: number;
}
