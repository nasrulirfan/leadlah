import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ListingsService } from "./listings.service";
import { ListingsController } from "./listings.controller";
import { ListingEntity } from "./entities/listing.entity";
import { CommissionEntity } from "../performance/entities/commission.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ListingEntity, CommissionEntity])],
  controllers: [ListingsController],
  providers: [ListingsService],
  exports: [ListingsService]
})
export class ListingsModule {}
