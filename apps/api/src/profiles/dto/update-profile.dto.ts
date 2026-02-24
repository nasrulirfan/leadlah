import { Type } from "class-transformer";
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { NotificationPreferencesDto } from "./notification-preferences.dto";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MinLength(6)
  @MaxLength(40)
  phone?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  agency?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  renNumber?: string | null;

  @IsOptional()
  @IsString()
  agencyLogoUrl?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  role?: string | null;

  @IsOptional()
  @IsString()
  bio?: string | null;

  @IsOptional()
  @IsString()
  avatarUrl?: string | null;

  @IsOptional()
  @IsString()
  coverUrl?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(2)
  timezone?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  language?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(40)
  whatsapp?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationPreferencesDto)
  notifications?: NotificationPreferencesDto;
}
