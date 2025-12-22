import { IsDateString, IsIn, IsInt, IsObject, IsOptional, IsString, IsUUID, Min } from "class-validator";
import type { ReminderType } from "@leadlah/core";
import type { ReminderRecurrence } from "../entities/reminder.entity";

export class CreateReminderDto {
  @IsString()
  type!: ReminderType | (string & {});

  @IsOptional()
  @IsUUID()
  listingId?: string | null;

  @IsDateString()
  dueAt!: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsIn(["NONE", "WEEKLY", "MONTHLY"])
  recurrence?: ReminderRecurrence;

  @IsOptional()
  @IsInt()
  @Min(1)
  recurrenceInterval?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown> | null;
}

