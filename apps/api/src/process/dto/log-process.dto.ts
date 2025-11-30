import { ProcessStage } from "@leadlah/core";
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class LogProcessDto {
  @IsEnum(ProcessStage)
  stage!: ProcessStage;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  actor?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}

