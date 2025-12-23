import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProcessService } from "./process.service";
import { ProcessController } from "./process.controller";
import { ProcessLogEntity } from "./entities/process-log.entity";
import { ProcessViewingEntity } from "./entities/process-viewing.entity";
import { LeadsModule } from "../leads/leads.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([ProcessLogEntity, ProcessViewingEntity]),
    LeadsModule,
  ],
  providers: [ProcessService],
  controllers: [ProcessController],
  exports: [ProcessService],
})
export class ProcessModule {}
