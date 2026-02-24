import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PerformanceController } from "./performance.controller";
import { PerformanceService } from "./performance.service";
import { TargetEntity } from "./entities/target.entity";
import { ExpenseEntity } from "./entities/expense.entity";
import { CommissionEntity } from "./entities/commission.entity";
import { FeatureFlagsModule } from "../feature-flags/feature-flags.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([TargetEntity, ExpenseEntity, CommissionEntity]),
    FeatureFlagsModule,
  ],
  controllers: [PerformanceController],
  providers: [PerformanceService],
  exports: [PerformanceService],
})
export class PerformanceModule {}
