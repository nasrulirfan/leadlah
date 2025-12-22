import { IsEmail, IsIn, IsOptional, IsString, IsUUID } from "class-validator";
import type { LeadStatus } from "../entities/lead.entity";

export class CreateLeadDto {
  @IsOptional()
  @IsUUID()
  listingId?: string | null;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsIn(["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"])
  status?: LeadStatus;

  @IsOptional()
  @IsString()
  message?: string | null;
}

