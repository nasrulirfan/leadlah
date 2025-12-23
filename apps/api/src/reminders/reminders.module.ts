import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RemindersService } from "./reminders.service";
import { RemindersController } from "./reminders.controller";
import { ReminderEntity } from "./entities/reminder.entity";
import { ProcessViewingEntity } from "../process/entities/process-viewing.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ReminderEntity, ProcessViewingEntity])],
  controllers: [RemindersController],
  providers: [RemindersService],
  exports: [RemindersService]
})
export class RemindersModule {}
