import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, Min, ValidateNested, IsIn, IsISO8601 } from "class-validator";
import { Type } from "class-transformer";
import { ListingStatus } from "@leadlah/core";

class MediaAssetDto {
  @IsUrl()
  url!: string;

  @IsOptional()
  @IsString()
  label?: string;
}

class ExternalLinkDto {
  @IsIn(["Mudah", "PropertyGuru", "Other"])
  provider!: "Mudah" | "PropertyGuru" | "Other";

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
