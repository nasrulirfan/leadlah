import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { ListingsService } from "./listings.service";
import { CreateListingDto } from "./dto/create-listing.dto";
import { UpdateListingDto } from "./dto/update-listing.dto";
import { ListListingsQueryDto } from "./dto/list-listings.query";
import { ListingPhotosService } from "./photos/listing-photos.service";
import { streamZip } from "../utils/zip-stream";
import { r2Fetch } from "../storage/r2";

@Controller("listings")
export class ListingsController {
  constructor(
    private readonly service: ListingsService,
    private readonly photos: ListingPhotosService,
  ) {}

  @Get("status-counts")
  statusCounts() {
    return this.service.statusCounts();
  }

  @Post()
  create(@Body() payload: CreateListingDto) {
    return this.service.create(payload);
  }

  @Get()
  findAll(@Query() query: ListListingsQueryDto) {
    return this.service.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: UpdateListingDto) {
    return this.service.update(id, payload);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }

  @Post(":id/photos/upload-urls")
  createPhotoUploadUrls(
    @Param("id") id: string,
    @Body()
    body: {
      files: { filename: string; contentType: string; bytes: number }[];
    },
  ) {
    return this.photos.createUploadUrls({ listingId: id, files: body.files ?? [] });
  }

  @Post(":id/photos/ingest")
  ingestPhotos(@Param("id") id: string, @Body() body: { stagedKeys: string[] }) {
    return this.photos.ingestStagedPhotos({ listingId: id, stagedKeys: body.stagedKeys ?? [] });
  }

  @Get(":id/photos/:photoId/download-url")
  photoDownloadUrl(@Param("id") id: string, @Param("photoId") photoId: string) {
    return this.photos.getDownloadUrl({ listingId: id, photoId });
  }

  @Patch(":id/photos/order")
  reorderPhotos(@Param("id") id: string, @Body() body: { photoIds: string[] }) {
    return this.photos.reorderPhotos({ listingId: id, photoIds: body.photoIds ?? [] });
  }

  @Delete(":id/photos/:photoId")
  deletePhoto(@Param("id") id: string, @Param("photoId") photoId: string) {
    return this.photos.deletePhoto({ listingId: id, photoId });
  }

  @Post(":id/photos/:photoId/replace")
  replacePhoto(
    @Param("id") id: string,
    @Param("photoId") photoId: string,
    @Body() body: { stagedKey: string },
  ) {
    return this.photos.replacePhoto({ listingId: id, photoId, stagedKey: body.stagedKey });
  }

  @Get(":id/photos/download-zip")
  async downloadZip(@Param("id") id: string, @Res() res: Response) {
    const plan = await this.photos.getZipPlan({ listingId: id });
    const filename = `${plan.listingName}-photos.zip`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Cache-Control", "no-store");

    const entries = plan.items.map((item) => ({
      filename: item.filename,
      stream: (async function* () {
        const response = await r2Fetch({ method: "GET", key: item.key });
        if (!response.ok || !response.body) {
          throw new Error(`Unable to fetch photo for export (${response.status}).`);
        }

        const reader = response.body.getReader();
        try {
          let result = await reader.read();
          while (!result.done) {
            if (result.value) {
              yield result.value;
            }
            result = await reader.read();
          }
        } finally {
          reader.releaseLock();
        }
      })(),
    }));

    await streamZip(res, entries);
    res.end();
  }
}
