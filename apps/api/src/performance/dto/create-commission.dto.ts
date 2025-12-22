import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class CreateCommissionDto {
  @IsOptional()
  @IsUUID()
  listingId?: string | null;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsDateString()
  closedDate!: string;

  @IsOptional()
  @IsString()
  notes?: string | null;
}

