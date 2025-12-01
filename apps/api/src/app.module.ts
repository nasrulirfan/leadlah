import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ListingEntity } from "./listings/entities/listing.entity";
import { ProcessLogEntity } from "./process/entities/process-log.entity";
import { ProcessViewingEntity } from "./process/entities/process-viewing.entity";
import { ListingsModule } from "./listings/listings.module";
import { ProcessModule } from "./process/process.module";
import { RemindersModule } from "./reminders/reminders.module";
import { SubscriptionModule } from "./subscription/subscription.module";

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
            entities: [ListingEntity, ProcessLogEntity, ProcessViewingEntity],
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
    SubscriptionModule
  ]
})
export class AppModule {}
