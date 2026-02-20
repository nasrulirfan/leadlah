import crypto from "crypto";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { ListingOptimizedPhoto, ListingPhoto, ListingPhotoVariant } from "@leadlah/core";
import { Repository } from "typeorm";
import { ListingEntity } from "../entities/listing.entity";
import {
  LISTING_PHOTO_ALLOWED_CONTENT_TYPES,
  LISTING_PHOTO_DOWNLOAD_URL_EXPIRES_SECONDS,
  LISTING_PHOTO_MAX_BYTES,
  LISTING_PHOTO_THUMB_WIDTH,
  LISTING_PHOTO_UPLOAD_URL_EXPIRES_SECONDS,
  LISTING_PHOTO_VARIANT_WIDTHS,
  LISTING_PHOTOS_MAX_COUNT,
} from "./listing-photos.constants";
import { r2Fetch, r2ObjectUrl, r2PresignedGetUrl, r2PresignedPutUrl } from "../../storage/r2";
import { listingEntityToListing } from "../listings.mapper";

type UploadFileDescriptor = {
  filename: string;
  contentType: string;
  bytes: number;
};

type UploadUrlResponse = {
  key: string;
  uploadUrl: string;
};

const isOptimizedPhoto = (photo: ListingPhoto): photo is ListingOptimizedPhoto =>
  Boolean(photo && typeof photo === "object" && "variants" in photo && "status" in photo);

const chooseBestVariantKey = (photo: ListingOptimizedPhoto) => {
  const webp = photo.variants
    .filter((v) => v.format === "webp" && v.kind === "RESPONSIVE")
    .sort((a, b) => b.width - a.width)[0];
  if (webp) {
    return { key: webp.key, format: "webp" as const };
  }
  const avif = photo.variants
    .filter((v) => v.format === "avif" && v.kind === "RESPONSIVE")
    .sort((a, b) => b.width - a.width)[0];
  if (avif) {
    return { key: avif.key, format: "avif" as const };
  }
  return null;
};

const sanitizeFilenameBase = (name: string) =>
  name
    .trim()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9 _-]+/gi, "")
    .replace(/\s+/g, " ")
    .slice(0, 80) || "photo";

@Injectable()
export class ListingPhotosService {
  constructor(
    @InjectRepository(ListingEntity)
    private readonly listings: Repository<ListingEntity>,
  ) {}

  private async getListingOrThrow(listingId: string) {
    const listing = await this.listings.findOne({ where: { id: listingId } });
    if (!listing) {
      throw new NotFoundException("Listing not found");
    }
    return listing;
  }

  private assertUploadDescriptor(file: UploadFileDescriptor) {
    if (!LISTING_PHOTO_ALLOWED_CONTENT_TYPES.has(file.contentType)) {
      throw new BadRequestException(
        `Unsupported image type (${file.contentType}). Allowed: JPEG, PNG, HEIC/HEIF.`,
      );
    }
    if (!Number.isFinite(file.bytes) || file.bytes <= 0) {
      throw new BadRequestException("Invalid file size.");
    }
    if (file.bytes > LISTING_PHOTO_MAX_BYTES) {
      throw new BadRequestException(
        `Image too large. Max ${(LISTING_PHOTO_MAX_BYTES / (1024 * 1024)).toFixed(0)} MB per image.`,
      );
    }
  }

  async createUploadUrls(params: {
    listingId: string;
    files: UploadFileDescriptor[];
  }): Promise<{ uploads: UploadUrlResponse[] }> {
    const listing = await this.getListingOrThrow(params.listingId);
    const existingCount = (listing.photos ?? []).length;
    const requested = params.files.length;

    if (requested <= 0) {
      throw new BadRequestException("No files provided.");
    }
    if (existingCount + requested > LISTING_PHOTOS_MAX_COUNT) {
      throw new BadRequestException(
        `You can upload up to ${LISTING_PHOTOS_MAX_COUNT} photos per listing.`,
      );
    }

    params.files.forEach((file) => this.assertUploadDescriptor(file));

    const uploads = params.files.map(() => {
      const key = `listings/${listing.id}/staging/${crypto.randomUUID()}`;
      return {
        key,
        uploadUrl: r2PresignedPutUrl({
          key,
          expiresSeconds: LISTING_PHOTO_UPLOAD_URL_EXPIRES_SECONDS,
        }),
      };
    });

    return { uploads };
  }

  async ingestStagedPhotos(params: {
    listingId: string;
    stagedKeys: string[];
  }) {
    const listing = await this.getListingOrThrow(params.listingId);
    const stagedKeys = (params.stagedKeys ?? []).filter(Boolean);

    if (stagedKeys.length === 0) {
      throw new BadRequestException("No staged uploads provided.");
    }
    if ((listing.photos?.length ?? 0) + stagedKeys.length > LISTING_PHOTOS_MAX_COUNT) {
      throw new BadRequestException(
        `You can upload up to ${LISTING_PHOTOS_MAX_COUNT} photos per listing.`,
      );
    }

    const now = new Date();

    const placeholders: ListingOptimizedPhoto[] = stagedKeys.map(() => ({
      id: crypto.randomUUID(),
      status: "PROCESSING",
      variants: [],
      createdAt: now,
      updatedAt: now,
    }));

    listing.photos = [...(listing.photos ?? []), ...placeholders];
    await this.listings.save(listing);

    for (let i = 0; i < stagedKeys.length; i += 1) {
      const stagedKey = stagedKeys[i]!;
      const photoId = placeholders[i]!.id;
      await this.processStagedPhoto({ listingId: listing.id, photoId, stagedKey });
    }

    const updated = await this.getListingOrThrow(listing.id);
    return listingEntityToListing(updated);
  }

  private async updatePhoto(params: {
    listingId: string;
    photoId: string;
    patch: Partial<ListingOptimizedPhoto>;
  }) {
    const listing = await this.getListingOrThrow(params.listingId);
    const photos = listing.photos ?? [];
    const index = photos.findIndex(
      (photo) => isOptimizedPhoto(photo) && photo.id === params.photoId,
    );
    if (index === -1) {
      throw new NotFoundException("Photo not found");
    }

    const current = photos[index] as ListingOptimizedPhoto;
    const next: ListingOptimizedPhoto = {
      ...current,
      ...params.patch,
      updatedAt: new Date(),
    };
    photos[index] = next;
    listing.photos = photos;
    await this.listings.save(listing);
    return next;
  }

  private async processStagedPhoto(params: { listingId: string; photoId: string; stagedKey: string }) {
    const { listingId, photoId, stagedKey } = params;
    const failureKeepsVariants = false;
    await this.processStagedPhotoInternal({ listingId, photoId, stagedKey, failureKeepsVariants });
  }

  private async processStagedPhotoInternal(params: {
    listingId: string;
    photoId: string;
    stagedKey: string;
    cleanupKeys?: string[];
    failureKeepsVariants: boolean;
  }) {
    const { listingId, photoId, stagedKey, cleanupKeys, failureKeepsVariants } = params;
    const uploadedKeys: string[] = [];

    try {
      const head = await r2Fetch({ method: "HEAD", key: stagedKey });
      if (!head.ok) {
        throw new Error(`Unable to read staged upload (${head.status}).`);
      }
      const contentType = head.headers.get("content-type") ?? "application/octet-stream";
      const contentLength = Number(head.headers.get("content-length") ?? "0");

      this.assertUploadDescriptor({
        filename: "upload",
        contentType,
        bytes: contentLength,
      });

      const response = await r2Fetch({ method: "GET", key: stagedKey });
      if (!response.ok) {
        throw new Error(`Unable to fetch staged upload (${response.status}).`);
      }
      const bytes = Buffer.from(await response.arrayBuffer());

      // sharp is an optional runtime dependency (installed in production containers)
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const sharp = require("sharp") as any;
      const image = sharp(bytes, { failOn: "none" });
      const meta = await image.metadata();
      const hasAlpha = Boolean(meta.hasAlpha);
      const width = typeof meta.width === "number" ? meta.width : undefined;
      const height = typeof meta.height === "number" ? meta.height : undefined;

      const variants: ListingPhotoVariant[] = [];

      for (const targetWidth of LISTING_PHOTO_VARIANT_WIDTHS) {
        const resized = image.clone().resize({ width: targetWidth, withoutEnlargement: true });

        const avifBuffer: Buffer = await resized
          .clone()
          .avif({
            quality: 60,
            effort: 4,
          })
          .toBuffer();

        const avifHash = crypto.createHash("sha256").update(avifBuffer).digest("hex");
        const avifKey = `listings/${listingId}/photos/v1/${avifHash}/${targetWidth}.avif`;
        await this.putOptimizedObject({
          key: avifKey,
          contentType: hasAlpha ? "image/avif" : "image/avif",
          body: avifBuffer,
        });
        uploadedKeys.push(avifKey);
        variants.push({
          key: avifKey,
          width: targetWidth,
          format: "avif",
          kind: "RESPONSIVE",
          bytes: avifBuffer.byteLength,
        });

        const webpBuffer: Buffer = await resized
          .clone()
          .webp({
            quality: 82,
            effort: 4,
            alphaQuality: hasAlpha ? 80 : undefined,
          })
          .toBuffer();

        const webpHash = crypto.createHash("sha256").update(webpBuffer).digest("hex");
        const webpKey = `listings/${listingId}/photos/v1/${webpHash}/${targetWidth}.webp`;
        await this.putOptimizedObject({
          key: webpKey,
          contentType: "image/webp",
          body: webpBuffer,
        });
        uploadedKeys.push(webpKey);
        variants.push({
          key: webpKey,
          width: targetWidth,
          format: "webp",
          kind: "RESPONSIVE",
          bytes: webpBuffer.byteLength,
        });
      }

      const thumb = image.clone().resize({ width: LISTING_PHOTO_THUMB_WIDTH, withoutEnlargement: true });

      const thumbAvif: Buffer = await thumb
        .clone()
        .avif({ quality: 55, effort: 4 })
        .toBuffer();
      const thumbAvifHash = crypto.createHash("sha256").update(thumbAvif).digest("hex");
      const thumbAvifKey = `listings/${listingId}/photos/v1/${thumbAvifHash}/thumb.avif`;
      await this.putOptimizedObject({ key: thumbAvifKey, contentType: "image/avif", body: thumbAvif });
      uploadedKeys.push(thumbAvifKey);
      variants.push({
        key: thumbAvifKey,
        width: LISTING_PHOTO_THUMB_WIDTH,
        format: "avif",
        kind: "THUMBNAIL",
        bytes: thumbAvif.byteLength,
      });

      const thumbWebp: Buffer = await thumb
        .clone()
        .webp({ quality: 80, effort: 4, alphaQuality: hasAlpha ? 80 : undefined })
        .toBuffer();
      const thumbWebpHash = crypto.createHash("sha256").update(thumbWebp).digest("hex");
      const thumbWebpKey = `listings/${listingId}/photos/v1/${thumbWebpHash}/thumb.webp`;
      await this.putOptimizedObject({ key: thumbWebpKey, contentType: "image/webp", body: thumbWebp });
      uploadedKeys.push(thumbWebpKey);
      variants.push({
        key: thumbWebpKey,
        width: LISTING_PHOTO_THUMB_WIDTH,
        format: "webp",
        kind: "THUMBNAIL",
        bytes: thumbWebp.byteLength,
      });

      await r2Fetch({ method: "DELETE", key: stagedKey });

      const totalOptimizedBytes = variants.reduce((acc, v) => acc + v.bytes, 0);
      const reduction = contentLength > 0 ? ((1 - totalOptimizedBytes / contentLength) * 100).toFixed(1) : null;
      if (reduction) {
        // eslint-disable-next-line no-console
        console.log(
          `[listing-photos] optimized listing=${listingId} photo=${photoId} original=${contentLength}B optimized=${totalOptimizedBytes}B reduction=${reduction}%`,
        );
      }

      await this.updatePhoto({
        listingId,
        photoId,
        patch: {
          status: "READY",
          error: undefined,
          width,
          height,
          variants,
        },
      });

      if (cleanupKeys?.length) {
        await Promise.all(
          cleanupKeys.map((key) => r2Fetch({ method: "DELETE", key }).catch(() => null)),
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to process photo.";
      // eslint-disable-next-line no-console
      console.warn(`[listing-photos] failed listing=${listingId} photo=${photoId}: ${message}`);
      await this.updatePhoto({
        listingId,
        photoId,
        patch: { status: "FAILED", error: message, ...(failureKeepsVariants ? {} : { variants: [] }) },
      });

      if (uploadedKeys.length) {
        await Promise.all(
          uploadedKeys.map((key) => r2Fetch({ method: "DELETE", key }).catch(() => null)),
        );
      }
      await r2Fetch({ method: "DELETE", key: stagedKey }).catch(() => null);
    }
  }

  private async putOptimizedObject(params: { key: string; contentType: string; body: Buffer }) {
    const response = await r2Fetch({
      method: "PUT",
      key: params.key,
      headers: {
        "content-type": params.contentType,
        "cache-control": "public, max-age=31536000, immutable",
      },
      body: params.body,
    });
    if (!response.ok) {
      throw new Error(`Unable to store optimized image (${response.status}).`);
    }
  }

  async getDownloadUrl(params: { listingId: string; photoId: string }) {
    const listing = await this.getListingOrThrow(params.listingId);
    const photo = (listing.photos ?? []).find(
      (item) => isOptimizedPhoto(item) && item.id === params.photoId,
    );
    if (!photo || !isOptimizedPhoto(photo)) {
      throw new NotFoundException("Photo not found");
    }
    if (photo.status !== "READY") {
      throw new BadRequestException("Photo is not ready yet.");
    }

    const best = chooseBestVariantKey(photo);
    if (!best) {
      throw new BadRequestException("No optimized variants available.");
    }

    const base = sanitizeFilenameBase(listing.propertyName);
    const filename = `${base}-${photo.id}.${best.format}`;
    const url = r2PresignedGetUrl({
      key: best.key,
      expiresSeconds: LISTING_PHOTO_DOWNLOAD_URL_EXPIRES_SECONDS,
      responseContentDisposition: `attachment; filename=\"${filename}\"`,
    });

    return { url, filename, publicUrl: r2ObjectUrl(best.key) };
  }

  async getPublicPhotoUrl(params: { key: string }) {
    const url = r2ObjectUrl(params.key);
    if (!url) {
      return null;
    }
    return { url };
  }

  async reorderPhotos(params: { listingId: string; photoIds: string[] }) {
    const listing = await this.getListingOrThrow(params.listingId);
    const photos = listing.photos ?? [];
    const optimized = photos.filter(isOptimizedPhoto);
    const others = photos.filter((photo) => !isOptimizedPhoto(photo));

    const desiredIds = params.photoIds ?? [];
    const existingIds = optimized.map((p) => p.id).sort();
    const nextIds = [...desiredIds].sort();

    if (existingIds.length !== nextIds.length || existingIds.some((id, i) => id !== nextIds[i])) {
      throw new BadRequestException("Photo order payload does not match listing photos.");
    }

    const byId = new Map(optimized.map((p) => [p.id, p] as const));
    const reordered = desiredIds.map((id) => byId.get(id)!).filter(Boolean);
    listing.photos = [...reordered, ...others];
    await this.listings.save(listing);
    const updated = await this.getListingOrThrow(listing.id);
    return listingEntityToListing(updated);
  }

  async deletePhoto(params: { listingId: string; photoId: string }) {
    const listing = await this.getListingOrThrow(params.listingId);
    const photos = listing.photos ?? [];
    const target = photos.find((photo) => isOptimizedPhoto(photo) && photo.id === params.photoId);
    if (!target) {
      throw new NotFoundException("Photo not found");
    }

    if (isOptimizedPhoto(target)) {
      const keys = Array.from(new Set((target.variants ?? []).map((v) => v.key))).filter(Boolean);
      await Promise.all(keys.map((key) => r2Fetch({ method: "DELETE", key }).catch(() => null)));
    }

    listing.photos = photos.filter(
      (photo) => !(isOptimizedPhoto(photo) && photo.id === params.photoId),
    );
    await this.listings.save(listing);
    const updated = await this.getListingOrThrow(listing.id);
    return listingEntityToListing(updated);
  }

  async replacePhoto(params: { listingId: string; photoId: string; stagedKey: string }) {
    const listing = await this.getListingOrThrow(params.listingId);
    const photos = listing.photos ?? [];
    const photo = photos.find((p) => isOptimizedPhoto(p) && p.id === params.photoId);
    if (!photo || !isOptimizedPhoto(photo)) {
      throw new NotFoundException("Photo not found");
    }

    const cleanupKeys = Array.from(new Set((photo.variants ?? []).map((v) => v.key))).filter(Boolean);
    photo.status = "PROCESSING";
    photo.error = undefined;
    photo.updatedAt = new Date();
    listing.photos = photos;
    await this.listings.save(listing);

    await this.processStagedPhotoInternal({
      listingId: listing.id,
      photoId: photo.id,
      stagedKey: params.stagedKey,
      cleanupKeys,
      failureKeepsVariants: true,
    });

    const updated = await this.getListingOrThrow(listing.id);
    return listingEntityToListing(updated);
  }

  async getZipPlan(params: { listingId: string }) {
    const listing = await this.getListingOrThrow(params.listingId);
    const readyPhotos = (listing.photos ?? []).filter(
      (photo) => isOptimizedPhoto(photo) && photo.status === "READY",
    ) as ListingOptimizedPhoto[];

    if (readyPhotos.length === 0) {
      throw new BadRequestException("No optimized photos available for export.");
    }

    const base = sanitizeFilenameBase(listing.propertyName);
    const items = readyPhotos
      .map((photo, idx) => {
        const best = chooseBestVariantKey(photo);
        if (!best) {
          return null;
        }
        const prefix = String(idx + 1).padStart(2, "0");
        return {
          key: best.key,
          filename: `${prefix}-${base}-${photo.id}.${best.format}`,
        };
      })
      .filter(Boolean) as { key: string; filename: string }[];

    if (items.length === 0) {
      throw new BadRequestException("No optimized photos available for export.");
    }

    return { listingName: base, items };
  }
}
