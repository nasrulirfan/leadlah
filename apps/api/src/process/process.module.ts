import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProcessService } from "./process.service";
import { ProcessController } from "./process.controller";
import { ProcessLogEntity } from "./entities/process-log.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ProcessLogEntity])],
  providers: [ProcessService],
  controllers: [ProcessController],
  exports: [ProcessService]
})
export class ProcessModule {}
