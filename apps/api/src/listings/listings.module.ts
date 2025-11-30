import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ListingsService } from "./listings.service";
import { ListingsController } from "./listings.controller";
import { ListingEntity } from "./entities/listing.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ListingEntity])],
  controllers: [ListingsController],
  providers: [ListingsService],
  exports: [ListingsService]
})
export class ListingsModule {}
