import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { ExpenseCategory } from "@leadlah/core";

export class CreateExpenseDto {
  @IsEnum(ExpenseCategory)
  category!: ExpenseCategory;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  description!: string;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsString()
  receiptUrl?: string | null;
}

