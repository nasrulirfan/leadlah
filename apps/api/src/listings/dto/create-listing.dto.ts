import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, Min } from "class-validator";
import { ListingStatus } from "@leadlah/core";

export class CreateListingDto {
  @IsString()
  @IsNotEmpty()
  propertyName!: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsNumber()
  @Min(0)
  size!: number;

  @IsNumber()
  @Min(0)
  bedrooms!: number;

  @IsNumber()
  @Min(0)
  bathrooms!: number;

  @IsString()
  @IsNotEmpty()
  location!: string;

  @IsEnum(ListingStatus)
  status: ListingStatus = ListingStatus.ACTIVE;

  @IsOptional()
  @IsUrl({}, { each: true })
  photos?: string[];

  @IsOptional()
  @IsUrl({}, { each: true })
  videos?: string[];

  @IsOptional()
  documents?: Record<string, string>[];

  @IsOptional()
  externalLinks?: { provider: string; url: string; expiresAt?: Date }[];
}
