import { IsEmail, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateCheckoutDto {
  @IsEmail()
  @MaxLength(120)
  customerEmail!: string;

  @IsString()
  @MaxLength(160)
  customerName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  redirectUrl?: string;
}
