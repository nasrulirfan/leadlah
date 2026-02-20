export const LISTING_PHOTOS_MAX_COUNT = 40;
export const LISTING_PHOTO_UPLOAD_URL_EXPIRES_SECONDS = 15 * 60;
export const LISTING_PHOTO_DOWNLOAD_URL_EXPIRES_SECONDS = 10 * 60;

export const LISTING_PHOTO_MAX_BYTES =
  Number(process.env.LISTING_PHOTO_MAX_BYTES ?? "") || 12 * 1024 * 1024;

export const LISTING_PHOTO_ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

export const LISTING_PHOTO_VARIANT_WIDTHS = [320, 768, 1280, 2048] as const;
export const LISTING_PHOTO_THUMB_WIDTH = 160;

