import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";
import type { LeadStatus } from "../entities/lead.entity";

export class ListLeadsQueryDto {
  @IsOptional()
  @IsIn(["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"])
  status?: LeadStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(250)
  limit?: number;
}

