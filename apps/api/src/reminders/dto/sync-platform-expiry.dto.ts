import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsUrl,
  Min,
  ValidateNested,
} from "class-validator";

class ExternalLinkDto {
  @IsIn(["Mudah", "PropertyGuru", "iProperty", "Other"])
  provider!: "Mudah" | "PropertyGuru" | "iProperty" | "Other";

  @IsUrl()
  url!: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class SyncPlatformExpiryDto {
  @IsArray()
  @ArrayMaxSize(25)
  @ValidateNested({ each: true })
  @Type(() => ExternalLinkDto)
  externalLinks!: ExternalLinkDto[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  leadDays?: number;
}

