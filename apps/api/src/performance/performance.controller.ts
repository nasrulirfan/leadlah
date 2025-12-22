import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { PerformanceService } from "./performance.service";
import { CreateTargetDto } from "./dto/create-target.dto";
import { UpdateTargetDto } from "./dto/update-target.dto";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";
import { CreateCommissionDto } from "./dto/create-commission.dto";
import { UpdateCommissionDto } from "./dto/update-commission.dto";

@Controller("performance")
export class PerformanceController {
  constructor(private readonly service: PerformanceService) {}

  @Get(":userId/targets")
  listTargets(@Param("userId") userId: string, @Query("year") year?: string) {
    const parsedYear = year ? Number(year) : undefined;
    return this.service.listTargets(
      userId,
      Number.isFinite(parsedYear) ? parsedYear : undefined,
    );
  }

  @Post(":userId/targets")
  upsertTarget(@Param("userId") userId: string, @Body() body: CreateTargetDto) {
    return this.service.upsertTarget(userId, body);
  }

  @Patch(":userId/targets/:id")
  updateTarget(
    @Param("userId") userId: string,
    @Param("id") id: string,
    @Body() body: UpdateTargetDto,
  ) {
    return this.service.updateTarget(userId, id, body);
  }

  @Delete(":userId/targets/:id")
  deleteTarget(@Param("userId") userId: string, @Param("id") id: string) {
    return this.service.deleteTarget(userId, id);
  }

  @Get(":userId/expenses")
  listExpenses(
    @Param("userId") userId: string,
    @Query("year") year?: string,
    @Query("month") month?: string,
  ) {
    const parsedYear = year ? Number(year) : undefined;
    const parsedMonth = month ? Number(month) : undefined;
    return this.service.listExpenses(
      userId,
      Number.isFinite(parsedYear) ? parsedYear : undefined,
      Number.isFinite(parsedMonth) ? parsedMonth : undefined,
    );
  }

  @Post(":userId/expenses")
  createExpense(
    @Param("userId") userId: string,
    @Body() body: CreateExpenseDto,
  ) {
    return this.service.createExpense(userId, body);
  }

  @Patch(":userId/expenses/:id")
  updateExpense(
    @Param("userId") userId: string,
    @Param("id") id: string,
    @Body() body: UpdateExpenseDto,
  ) {
    return this.service.updateExpense(userId, id, body);
  }

  @Delete(":userId/expenses/:id")
  deleteExpense(@Param("userId") userId: string, @Param("id") id: string) {
    return this.service.deleteExpense(userId, id);
  }

  @Get(":userId/commissions")
  listCommissions(
    @Param("userId") userId: string,
    @Query("year") year?: string,
    @Query("month") month?: string,
  ) {
    const parsedYear = year ? Number(year) : undefined;
    const parsedMonth = month ? Number(month) : undefined;
    return this.service.listCommissions(
      userId,
      Number.isFinite(parsedYear) ? parsedYear : undefined,
      Number.isFinite(parsedMonth) ? parsedMonth : undefined,
    );
  }

  @Post(":userId/commissions")
  createCommission(
    @Param("userId") userId: string,
    @Body() body: CreateCommissionDto,
  ) {
    return this.service.createCommission(userId, body);
  }

  @Patch(":userId/commissions/:id")
  updateCommission(
    @Param("userId") userId: string,
    @Param("id") id: string,
    @Body() body: UpdateCommissionDto,
  ) {
    return this.service.updateCommission(userId, id, body);
  }

  @Delete(":userId/commissions/:id")
  deleteCommission(@Param("userId") userId: string, @Param("id") id: string) {
    return this.service.deleteCommission(userId, id);
  }

  @Get(":userId/reports")
  reports(@Param("userId") userId: string, @Query("year") year?: string) {
    const parsedYear = year ? Number(year) : NaN;
    const resolvedYear = Number.isFinite(parsedYear)
      ? parsedYear
      : new Date().getFullYear();
    return this.service.reports(userId, resolvedYear);
  }
}
