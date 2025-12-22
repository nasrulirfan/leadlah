import { IsBoolean, IsOptional } from "class-validator";

export class NotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  reminders?: boolean;

  @IsOptional()
  @IsBoolean()
  smartDigest?: boolean;

  @IsOptional()
  @IsBoolean()
  productUpdates?: boolean;
}

