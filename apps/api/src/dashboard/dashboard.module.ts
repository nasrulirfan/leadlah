import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { ListingEntity } from "../listings/entities/listing.entity";
import { ProcessLogEntity } from "../process/entities/process-log.entity";
import { ReminderEntity } from "../reminders/entities/reminder.entity";
import { TargetEntity } from "../performance/entities/target.entity";
import { CommissionEntity } from "../performance/entities/commission.entity";
import { ExpenseEntity } from "../performance/entities/expense.entity";
import { LeadEntity } from "../leads/entities/lead.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ListingEntity,
      ProcessLogEntity,
      ReminderEntity,
      TargetEntity,
      CommissionEntity,
      ExpenseEntity,
      LeadEntity,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}

