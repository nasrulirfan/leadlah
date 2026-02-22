import { IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, Min, ValidateNested, IsIn, IsISO8601 } from "class-validator";
import { Type } from "class-transformer";
import { ListingCategory, ListingStatus, ListingTenure } from "@leadlah/core";

class MediaAssetDto {
  @IsUrl()
  url!: string;

  @IsOptional()
  @IsString()
  label?: string;
}

class ExternalLinkDto {
  @IsIn(["Mudah", "PropertyGuru", "iProperty", "Other"])
  provider!: "Mudah" | "PropertyGuru" | "iProperty" | "Other";

  @IsUrl()
  url!: string;

  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}

export class CreateListingDto {
  @IsString()
  @IsNotEmpty()
  propertyName!: string;

  @IsOptional()
  @IsString()
  lotUnitNo?: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsOptional()
  @IsEnum(ListingCategory)
  category?: ListingCategory;

  @IsOptional()
  @IsEnum(ListingTenure)
  tenure?: ListingTenure;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bankValue?: number;

  @IsOptional()
  @IsString()
  competitorPriceRange?: string;

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

  @IsOptional()
  @IsString()
  buildingProject?: string;

  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  lastEnquiryAt?: Date;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaAssetDto)
  photos?: MediaAssetDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaAssetDto)
  videos?: MediaAssetDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaAssetDto)
  documents?: MediaAssetDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ExternalLinkDto)
  externalLinks?: ExternalLinkDto[];
}
