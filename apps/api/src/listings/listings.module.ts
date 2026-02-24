import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ListingsService } from "./listings.service";
import { ListingsController } from "./listings.controller";
import { ListingEntity } from "./entities/listing.entity";
import { ListingPhotosService } from "./photos/listing-photos.service";

@Module({
  imports: [TypeOrmModule.forFeature([ListingEntity])],
  controllers: [ListingsController],
  providers: [ListingsService, ListingPhotosService],
  exports: [ListingsService]
})
export class ListingsModule {}
