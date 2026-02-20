import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ListingEntity } from "./listings/entities/listing.entity";
import { ProcessLogEntity } from "./process/entities/process-log.entity";
import { ProcessViewingEntity } from "./process/entities/process-viewing.entity";
import { ListingsModule } from "./listings/listings.module";
import { ProcessModule } from "./process/process.module";
import { RemindersModule } from "./reminders/reminders.module";
import { ReminderEntity } from "./reminders/entities/reminder.entity";
import { SubscriptionModule } from "./subscription/subscription.module";
import { SubscriptionEntity } from "./subscription/entities/subscription.entity";
import { SubscriptionInvoiceEntity } from "./subscription/entities/subscription-invoice.entity";
import { ProfilesModule } from "./profiles/profiles.module";
import { ProfileEntity } from "./profiles/entities/profile.entity";
import { PerformanceModule } from "./performance/performance.module";
import { TargetEntity } from "./performance/entities/target.entity";
import { ExpenseEntity } from "./performance/entities/expense.entity";
import { CommissionEntity } from "./performance/entities/commission.entity";
import { LeadsModule } from "./leads/leads.module";
import { LeadEntity } from "./leads/entities/lead.entity";
import { DashboardModule } from "./dashboard/dashboard.module";
import { MediaModule } from "./media/media.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        if (process.env.NODE_ENV === "test") {
          return {
            type: "sqljs",
            synchronize: true,
            autoSave: false,
            entities: [
              ListingEntity,
              ProcessLogEntity,
              ProcessViewingEntity,
              SubscriptionEntity,
              SubscriptionInvoiceEntity,
              ReminderEntity,
              ProfileEntity,
              TargetEntity,
              ExpenseEntity,
              CommissionEntity,
              LeadEntity
            ],
            dropSchema: true
          };
        }
        const url = process.env.DATABASE_URL;
        if (!url) {
          throw new Error("DATABASE_URL must be set to connect to Postgres.");
        }
        return {
          type: "postgres",
          url,
          autoLoadEntities: true,
          synchronize: false
        };
      }
    }),
    ListingsModule,
    ProcessModule,
    RemindersModule,
    SubscriptionModule,
    ProfilesModule,
    PerformanceModule,
    LeadsModule,
    DashboardModule,
    MediaModule
  ]
})
export class AppModule {}
