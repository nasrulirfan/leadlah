import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class UpdateCommissionDto {
  @IsOptional()
  @IsUUID()
  listingId?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsDateString()
  closedDate?: string;

  @IsOptional()
  @IsString()
  notes?: string | null;
}

