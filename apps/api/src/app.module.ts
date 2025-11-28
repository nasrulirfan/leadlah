import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ListingsModule } from "./listings/listings.module";
import { ProcessModule } from "./process/process.module";
import { RemindersModule } from "./reminders/reminders.module";
import { SubscriptionModule } from "./subscription/subscription.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ListingsModule,
    ProcessModule,
    RemindersModule,
    SubscriptionModule
  ]
})
export class AppModule {}
