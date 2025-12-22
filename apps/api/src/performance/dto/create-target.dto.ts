import { IsInt, IsNumber, IsOptional, Max, Min } from "class-validator";

export class CreateTargetDto {
  @IsInt()
  @Min(2000)
  year!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number | null;

  @IsInt()
  @Min(0)
  targetUnits!: number;

  @IsNumber()
  @Min(0)
  targetIncome!: number;
}

