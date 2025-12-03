import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SubscriptionService } from "./subscription.service";
import { SubscriptionController } from "./subscription.controller";
import { SubscriptionEntity } from "./entities/subscription.entity";
import { SubscriptionInvoiceEntity } from "./entities/subscription-invoice.entity";

@Module({
  imports: [TypeOrmModule.forFeature([SubscriptionEntity, SubscriptionInvoiceEntity])],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService]
})
export class SubscriptionModule {}
