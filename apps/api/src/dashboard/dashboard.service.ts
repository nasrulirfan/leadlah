import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ListingEntity } from "../listings/entities/listing.entity";
import { ProcessLogEntity } from "../process/entities/process-log.entity";
import { ReminderEntity } from "../reminders/entities/reminder.entity";
import { TargetEntity } from "../performance/entities/target.entity";
import { CommissionEntity } from "../performance/entities/commission.entity";
import { ExpenseEntity } from "../performance/entities/expense.entity";
import { LeadEntity } from "../leads/entities/lead.entity";

export type DashboardActivityType =
  | "listing"
  | "sale"
  | "lead"
  | "reminder"
  | "target"
  | "expense";

export type DashboardActivity = {
  id: string;
  type: DashboardActivityType;
  title: string;
  description: string;
  occurredAt: Date;
};

const titleCase = (value: string) =>
  value
    .toLowerCase()
    .split(/[_\s]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(ListingEntity)
    private readonly listings: Repository<ListingEntity>,
    @InjectRepository(ProcessLogEntity)
    private readonly processLogs: Repository<ProcessLogEntity>,
    @InjectRepository(ReminderEntity)
    private readonly reminders: Repository<ReminderEntity>,
    @InjectRepository(TargetEntity)
    private readonly targets: Repository<TargetEntity>,
    @InjectRepository(CommissionEntity)
    private readonly commissions: Repository<CommissionEntity>,
    @InjectRepository(ExpenseEntity)
    private readonly expenses: Repository<ExpenseEntity>,
    @InjectRepository(LeadEntity)
    private readonly leads: Repository<LeadEntity>,
  ) {}

  async activities(userId: string, limit = 20): Promise<DashboardActivity[]> {
    const [
      listingRows,
      reminderRows,
      targetRows,
      commissionRows,
      expenseRows,
      leadRows,
    ] = await Promise.all([
      this.listings.find({ order: { createdAt: "DESC" }, take: 6 }),
      this.reminders.find({
        where: { userId },
        relations: { listing: true },
        order: { updatedAt: "DESC" },
        take: 6,
      }),
      this.targets.find({
        where: { userId },
        order: { createdAt: "DESC" },
        take: 4,
      }),
      this.commissions.find({
        where: { userId },
        relations: { listing: true },
        order: { createdAt: "DESC" },
        take: 4,
      }),
      this.expenses.find({
        where: { userId },
        order: { createdAt: "DESC" },
        take: 4,
      }),
      this.leads.find({
        where: { userId },
        relations: { listing: true },
        order: { createdAt: "DESC" },
        take: 6,
      }),
    ]);

    const processCompleted = await this.processLogs
      .createQueryBuilder("pl")
      .leftJoinAndSelect("pl.listing", "listing")
      .where("pl.completedAt IS NOT NULL")
      .orderBy("pl.completedAt", "DESC")
      .take(6)
      .getMany();

    const activities: DashboardActivity[] = [
      ...listingRows.map(
        (row) =>
          ({
            id: row.id,
            type: "listing",
            title: "New listing added",
            description: row.propertyName,
            occurredAt: row.createdAt,
          }) satisfies DashboardActivity,
      ),
      ...processCompleted.map(
        (row) =>
          ({
            id: row.id,
            type: "listing",
            title: `${titleCase(String(row.stage))} completed`,
            description: row.listing?.propertyName ?? row.listingId,
            occurredAt: row.completedAt ?? row.updatedAt,
          }) satisfies DashboardActivity,
      ),
      ...reminderRows.map((row) => {
        const status = String(row.status ?? "").toUpperCase();
        const title =
          status === "DONE"
            ? "Reminder completed"
            : status === "DISMISSED"
              ? "Reminder dismissed"
              : "Reminder scheduled";
        const listingName = row.listing?.propertyName;
        const description = listingName
          ? `${listingName} • ${row.message}`
          : row.message;
        return {
          id: row.id,
          type: "reminder",
          title,
          description,
          occurredAt: row.updatedAt,
        } satisfies DashboardActivity;
      }),
      ...targetRows.map((row) => {
        const monthLabel =
          row.month == null
            ? `Year ${row.year}`
            : `${new Date(row.year, row.month - 1).toLocaleString("default", { month: "short" })} ${row.year}`;
        return {
          id: row.id,
          type: "target",
          title: "Target set",
          description: `${monthLabel} • ${row.targetUnits} units • RM ${row.targetIncome.toLocaleString()}`,
          occurredAt: row.createdAt,
        } satisfies DashboardActivity;
      }),
      ...commissionRows.map(
        (row) =>
          ({
            id: row.id,
            type: "sale",
            title: "Commission recorded",
            description: row.listing?.propertyName
              ? `${row.listing.propertyName} • RM ${row.amount.toLocaleString()}`
              : `RM ${row.amount.toLocaleString()}`,
            occurredAt: row.closedDate,
          }) satisfies DashboardActivity,
      ),
      ...expenseRows.map(
        (row) =>
          ({
            id: row.id,
            type: "expense",
            title: "Expense logged",
            description: `${row.category} • RM ${row.amount.toLocaleString()} • ${row.description}`,
            occurredAt: row.createdAt,
          }) satisfies DashboardActivity,
      ),
      ...leadRows.map(
        (row) =>
          ({
            id: row.id,
            type: "lead",
            title: "New lead received",
            description: row.listing?.propertyName
              ? `${row.name} • ${row.listing.propertyName}`
              : `${row.name} • ${row.status}`,
            occurredAt: row.createdAt,
          }) satisfies DashboardActivity,
      ),
    ];

    return activities
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
      .slice(0, limit);
  }
}
