import { IsInt, IsNumber, IsOptional, Min } from "class-validator";

export class UpdateTargetDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  targetUnits?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  targetIncome?: number;
}

