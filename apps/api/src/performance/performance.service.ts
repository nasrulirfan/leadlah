import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { Expense, PerformanceMetrics, Target } from "@leadlah/core";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, IsNull, Repository } from "typeorm";
import { TargetEntity } from "./entities/target.entity";
import { ExpenseEntity } from "./entities/expense.entity";
import { CommissionEntity } from "./entities/commission.entity";
import { CreateTargetDto } from "./dto/create-target.dto";
import { UpdateTargetDto } from "./dto/update-target.dto";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";
import { CreateCommissionDto } from "./dto/create-commission.dto";
import { UpdateCommissionDto } from "./dto/update-commission.dto";

type NumericRecord = Record<string, string | number | null>;

const toNumber = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) {
    return 0;
  }

  return typeof value === "number" ? value : Number(value);
};

const buildEmptyMetrics = (year: number, month?: number): PerformanceMetrics => ({
  period: typeof month === "number" ? { year, month } : { year },
  target: { units: 0, commission: 0 },
  actual: {
    units: 0,
    commission: 0,
    expenses: 0,
    netIncome: 0,
  },
  progress: {
    unitsPercent: 0,
    commissionPercent: 0,
  },
});

const sortTargets = (items: Target[]) => {
  const monthValue = (month?: number) => (typeof month === "number" ? month : -Infinity);

  return [...items].sort((a, b) => {
    if (a.year !== b.year) {
      return b.year - a.year;
    }

    return monthValue(b.month) - monthValue(a.month);
  });
};

const sortExpenses = (items: Expense[]) =>
  [...items].sort((a, b) => b.date.getTime() - a.date.getTime());

export type ApiCommission = {
  id: string;
  userId: string;
  listingId?: string | null;
  amount: number;
  closedDate: Date;
  notes?: string;
  createdAt: Date;
};

const sortCommissions = (items: ApiCommission[]) =>
  [...items].sort((a, b) => b.closedDate.getTime() - a.closedDate.getTime());

@Injectable()
export class PerformanceService {
  constructor(
    @InjectRepository(TargetEntity)
    private readonly targets: Repository<TargetEntity>,
    @InjectRepository(ExpenseEntity)
    private readonly expenses: Repository<ExpenseEntity>,
    @InjectRepository(CommissionEntity)
    private readonly commissions: Repository<CommissionEntity>,
  ) {}

  private toTarget(entity: TargetEntity): Target {
    return {
      id: entity.id,
      userId: entity.userId,
      year: entity.year,
      month: entity.month ?? undefined,
      targetUnits: entity.targetUnits,
      targetCommission: entity.targetCommission,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private isUniqueViolation(error: unknown) {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: unknown }).code === "23505"
    );
  }

  async listTargets(userId: string, year?: number): Promise<Target[]> {
    const items = await this.targets.find({
      where: year != null ? { userId, year } : { userId },
      order: { year: "DESC" },
    });

    const deduped = new Map<string, Target>();
    for (const item of items) {
      const target = this.toTarget(item);
      const key = `${target.year}:${target.month ?? "annual"}`;
      const existing = deduped.get(key);
      if (!existing || target.updatedAt.getTime() > existing.updatedAt.getTime()) {
        deduped.set(key, target);
      }
    }

    return sortTargets([...deduped.values()]);
  }

  private normalizeMonth(month: number | null | undefined) {
    if (month === null || month === undefined) {
      return null;
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new BadRequestException("month must be between 1 and 12");
    }
    return month;
  }

  async upsertTarget(userId: string, payload: CreateTargetDto): Promise<Target> {
    const month = this.normalizeMonth(payload.month);

    const where: FindOptionsWhere<TargetEntity> =
      month === null
        ? { userId, year: payload.year, month: IsNull() }
        : { userId, year: payload.year, month };

    const existing = await this.targets.findOne({
      where,
      order: { updatedAt: "DESC", createdAt: "DESC" },
    });

    if (existing) {
      existing.targetUnits = payload.targetUnits;
      existing.targetCommission = payload.targetCommission;
      return this.toTarget(await this.targets.save(existing));
    }

    try {
      const created = this.targets.create({
        userId,
        year: payload.year,
        month,
        targetUnits: payload.targetUnits,
        targetCommission: payload.targetCommission,
      });
      return this.toTarget(await this.targets.save(created));
    } catch (error) {
      if (!this.isUniqueViolation(error)) {
        throw error;
      }

      await this.targets.update(where, {
        targetUnits: payload.targetUnits,
        targetCommission: payload.targetCommission,
      });

      const entity = await this.targets.findOne({ where });
      if (!entity) {
        throw new NotFoundException("Target not found after upsert");
      }
      return this.toTarget(entity);
    }
  }

  async updateTarget(userId: string, id: string, payload: UpdateTargetDto): Promise<Target> {
    const entity = await this.targets.findOne({ where: { id, userId } });
    if (!entity) {
      throw new NotFoundException("Target not found");
    }

    if (payload.targetUnits != null) {
      entity.targetUnits = payload.targetUnits;
    }
    if (payload.targetCommission != null) {
      entity.targetCommission = payload.targetCommission;
    }

    const saved = await this.targets.save(entity);
    return {
      id: saved.id,
      userId: saved.userId,
      year: saved.year,
      month: saved.month ?? undefined,
      targetUnits: saved.targetUnits,
      targetCommission: saved.targetCommission,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }

  async deleteTarget(userId: string, id: string) {
    const result = await this.targets.delete({ id, userId });
    if (!result.affected) {
      throw new NotFoundException("Target not found");
    }
    return { id };
  }

  async listExpenses(userId: string, year?: number, month?: number): Promise<Expense[]> {
    const qb = this.expenses
      .createQueryBuilder("expense")
      .where("expense.userId = :userId", { userId })
      .orderBy("expense.date", "DESC")
      .addOrderBy("expense.createdAt", "DESC");

    if (year != null) {
      qb.andWhere(
        process.env.NODE_ENV === "test"
          ? 'strftime("%Y", expense.date) = :year'
          : "EXTRACT(YEAR FROM expense.date) = :year",
        { year: process.env.NODE_ENV === "test" ? String(year) : year },
      );
    }

    if (month != null) {
      qb.andWhere(
        process.env.NODE_ENV === "test"
          ? 'strftime("%m", expense.date) = :month'
          : "EXTRACT(MONTH FROM expense.date) = :month",
        {
          month: process.env.NODE_ENV === "test" ? String(month).padStart(2, "0") : month,
        },
      );
    }

    const items = await qb.getMany();

    return sortExpenses(
      items.map((item) => ({
        id: item.id,
        userId: item.userId,
        category: item.category,
        amount: item.amount,
        description: item.description,
        date: item.date,
        receiptUrl: item.receiptUrl ?? undefined,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
    );
  }

  async createExpense(userId: string, payload: CreateExpenseDto): Promise<Expense> {
    const entity = this.expenses.create({
      userId,
      category: payload.category,
      amount: payload.amount,
      description: payload.description,
      date: new Date(payload.date),
      receiptUrl: payload.receiptUrl ?? null,
    });
    const saved = await this.expenses.save(entity);
    return {
      id: saved.id,
      userId: saved.userId,
      category: saved.category,
      amount: saved.amount,
      description: saved.description,
      date: saved.date,
      receiptUrl: saved.receiptUrl ?? undefined,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }

  async updateExpense(userId: string, id: string, payload: UpdateExpenseDto): Promise<Expense> {
    const entity = await this.expenses.findOne({ where: { id, userId } });
    if (!entity) {
      throw new NotFoundException("Expense not found");
    }

    if (payload.category != null) {
      entity.category = payload.category;
    }
    if (payload.amount != null) {
      entity.amount = payload.amount;
    }
    if (payload.description != null) {
      entity.description = payload.description;
    }
    if (payload.date != null) {
      entity.date = new Date(payload.date);
    }
    if (payload.receiptUrl !== undefined) {
      entity.receiptUrl = payload.receiptUrl ?? null;
    }

    const saved = await this.expenses.save(entity);
    return {
      id: saved.id,
      userId: saved.userId,
      category: saved.category,
      amount: saved.amount,
      description: saved.description,
      date: saved.date,
      receiptUrl: saved.receiptUrl ?? undefined,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }

  async deleteExpense(userId: string, id: string) {
    const result = await this.expenses.delete({ id, userId });
    if (!result.affected) {
      throw new NotFoundException("Expense not found");
    }
    return { id };
  }

  async listCommissions(userId: string, year?: number, month?: number): Promise<ApiCommission[]> {
    const qb = this.commissions
      .createQueryBuilder("commission")
      .where("commission.userId = :userId", { userId })
      .orderBy("commission.closedDate", "DESC")
      .addOrderBy("commission.createdAt", "DESC");

    if (year != null) {
      qb.andWhere(
        process.env.NODE_ENV === "test"
          ? 'strftime("%Y", commission.closedDate) = :year'
          : "EXTRACT(YEAR FROM commission.closedDate) = :year",
        { year: process.env.NODE_ENV === "test" ? String(year) : year },
      );
    }

    if (month != null) {
      qb.andWhere(
        process.env.NODE_ENV === "test"
          ? 'strftime("%m", commission.closedDate) = :month'
          : "EXTRACT(MONTH FROM commission.closedDate) = :month",
        {
          month: process.env.NODE_ENV === "test" ? String(month).padStart(2, "0") : month,
        },
      );
    }

    const items = await qb.getMany();

    return sortCommissions(
      items.map((item) => ({
        id: item.id,
        userId: item.userId,
        listingId: item.listingId ?? null,
        amount: item.amount,
        closedDate: item.closedDate,
        notes: item.notes ?? undefined,
        createdAt: item.createdAt,
      })),
    );
  }

  async createCommission(userId: string, payload: CreateCommissionDto): Promise<ApiCommission> {
    const entity = this.commissions.create({
      userId,
      listingId: payload.listingId ?? null,
      amount: payload.amount,
      closedDate: new Date(payload.closedDate),
      notes: payload.notes ?? null,
    });
    const saved = await this.commissions.save(entity);
    return {
      id: saved.id,
      userId: saved.userId,
      listingId: saved.listingId ?? null,
      amount: saved.amount,
      closedDate: saved.closedDate,
      notes: saved.notes ?? undefined,
      createdAt: saved.createdAt,
    };
  }

  async updateCommission(
    userId: string,
    id: string,
    payload: UpdateCommissionDto,
  ): Promise<ApiCommission> {
    const entity = await this.commissions.findOne({ where: { id, userId } });
    if (!entity) {
      throw new NotFoundException("Commission not found");
    }

    if (payload.listingId !== undefined) {
      entity.listingId = payload.listingId ?? null;
    }
    if (payload.amount != null) {
      entity.amount = payload.amount;
    }
    if (payload.closedDate != null) {
      entity.closedDate = new Date(payload.closedDate);
    }
    if (payload.notes !== undefined) {
      entity.notes = payload.notes ?? null;
    }

    const saved = await this.commissions.save(entity);
    return {
      id: saved.id,
      userId: saved.userId,
      listingId: saved.listingId ?? null,
      amount: saved.amount,
      closedDate: saved.closedDate,
      notes: saved.notes ?? undefined,
      createdAt: saved.createdAt,
    };
  }

  async deleteCommission(userId: string, id: string) {
    const result = await this.commissions.delete({ id, userId });
    if (!result.affected) {
      throw new NotFoundException("Commission not found");
    }
    return { id };
  }

  async metrics(userId: string, year: number) {
    const [targetResult, commissionResult, expenseResult] = await Promise.all([
      this.targets
        .createQueryBuilder("target")
        .select([
          "target.month AS month",
          "target.targetUnits AS target_units",
          "target.targetCommission AS target_commission",
        ])
        .where("target.userId = :userId", { userId })
        .andWhere("target.year = :year", { year })
        .orderBy("target.updatedAt", "DESC")
        .addOrderBy("target.createdAt", "DESC")
        .getRawMany<NumericRecord>(),
      this.commissions
        .createQueryBuilder("commission")
        .select([
          (process.env.NODE_ENV === "test"
            ? 'CAST(strftime("%m", commission.closedDate) AS INTEGER)'
            : "EXTRACT(MONTH FROM commission.closedDate)") + " AS month",
          "COUNT(*) AS units",
          "COALESCE(SUM(commission.amount), 0) AS total",
        ])
        .where("commission.userId = :userId", { userId })
        .andWhere(
          process.env.NODE_ENV === "test"
            ? 'strftime("%Y", commission.closedDate) = :year'
            : "EXTRACT(YEAR FROM commission.closedDate) = :year",
          { year: process.env.NODE_ENV === "test" ? String(year) : year },
        )
        .groupBy("month")
        .getRawMany<NumericRecord>(),
      this.expenses
        .createQueryBuilder("expense")
        .select([
          (process.env.NODE_ENV === "test"
            ? 'CAST(strftime("%m", expense.date) AS INTEGER)'
            : "EXTRACT(MONTH FROM expense.date)") + " AS month",
          "COALESCE(SUM(expense.amount), 0) AS total",
        ])
        .where("expense.userId = :userId", { userId })
        .andWhere(
          process.env.NODE_ENV === "test"
            ? 'strftime("%Y", expense.date) = :year'
            : "EXTRACT(YEAR FROM expense.date) = :year",
          { year: process.env.NODE_ENV === "test" ? String(year) : year },
        )
        .groupBy("month")
        .getRawMany<NumericRecord>(),
    ]);

    const monthlyTargets = new Map<number, { units: number; commission: number }>();
    let annualTarget: { units: number; commission: number } | null = null;
    let monthlyTargetSum = { units: 0, commission: 0 };

    for (const row of targetResult) {
      const units = toNumber(row.target_units);
      const commission = toNumber(row.target_commission);
      const monthValue = row.month === null ? null : toNumber(row.month);

      if (monthValue === null) {
        annualTarget ??= { units, commission };
      } else {
        const month = monthValue;
        if (!monthlyTargets.has(month)) {
          monthlyTargets.set(month, { units, commission });
          monthlyTargetSum = {
            units: monthlyTargetSum.units + units,
            commission: monthlyTargetSum.commission + commission,
          };
        }
      }
    }

    const monthlyCommissions = new Map<number, { units: number; total: number }>();
    for (const row of commissionResult) {
      const month = toNumber(row.month);
      monthlyCommissions.set(month, {
        units: toNumber(row.units),
        total: toNumber(row.total),
      });
    }

    const monthlyExpenses = new Map<number, number>();
    for (const row of expenseResult) {
      const month = toNumber(row.month);
      monthlyExpenses.set(month, toNumber(row.total));
    }

    const monthlyReports = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const target = monthlyTargets.get(month) ?? { units: 0, commission: 0 };
      const commission = monthlyCommissions.get(month) ?? { units: 0, total: 0 };
      const expenses = monthlyExpenses.get(month) ?? 0;
      const netIncome = commission.total - expenses;

      return {
        period: { year, month },
        target,
        actual: {
          units: commission.units,
          commission: commission.total,
          expenses,
          netIncome,
        },
        progress: {
          unitsPercent: target.units > 0 ? (commission.units / target.units) * 100 : 0,
          commissionPercent:
            target.commission > 0 ? (commission.total / target.commission) * 100 : 0,
        },
      } satisfies PerformanceMetrics;
    });

    const yearlyActual = monthlyReports.reduce(
      (acc, report) => ({
        units: acc.units + report.actual.units,
        commission: acc.commission + report.actual.commission,
        expenses: acc.expenses + report.actual.expenses,
        netIncome: acc.netIncome + report.actual.netIncome,
      }),
      { units: 0, commission: 0, expenses: 0, netIncome: 0 },
    );

    const yearlyTarget = annualTarget ?? monthlyTargetSum;
    const yearlyReport: PerformanceMetrics = {
      period: { year },
      target: yearlyTarget,
      actual: yearlyActual,
      progress: {
        unitsPercent: yearlyTarget.units > 0 ? (yearlyActual.units / yearlyTarget.units) * 100 : 0,
        commissionPercent:
          yearlyTarget.commission > 0
            ? (yearlyActual.commission / yearlyTarget.commission) * 100
            : 0,
      },
    };

    return {
      yearlyReport: yearlyReport ?? buildEmptyMetrics(year),
      monthlyReports: monthlyReports.length ? monthlyReports : Array.from({ length: 12 }, (_, i) => buildEmptyMetrics(year, i + 1)),
    };
  }
}
