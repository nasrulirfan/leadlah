/* eslint-disable jsx-a11y/label-has-associated-control */
"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { ListingInput } from "@leadlah/core";
import { Reorder } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Download, GripVertical, ImagePlus, RefreshCcw, Trash2 } from "lucide-react";
import {
  deleteListingPhotoAction,
  ingestListingPhotosAction,
  reorderListingPhotosAction,
  replaceListingPhotoAction,
} from "./actions";
import { stageListingPhotos } from "./photo-upload";

const MAX_COUNT = 40;
const MAX_BYTES = 12 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const keyToUrl = (key: string) =>
  `${API_BASE_URL.replace(/\/$/, "")}/media/r2?key=${encodeURIComponent(key)}`;

type ListingPhotoVariantLike = {
  key: string;
  width: number;
  format: "avif" | "webp";
  kind: "RESPONSIVE" | "THUMBNAIL" | "DOWNLOAD";
  bytes: number;
};

type ListingOptimizedPhotoLike = {
  id: string;
  alt?: string;
  status: "READY" | "PROCESSING" | "FAILED";
  error?: string;
  variants?: ListingPhotoVariantLike[];
};

type ListingPhotoLike = { url: string; label?: string } | ListingOptimizedPhotoLike;

const isOptimizedPhoto = (photo: ListingPhotoLike): photo is ListingOptimizedPhotoLike =>
  Boolean(photo && typeof photo === "object" && "id" in photo && "status" in photo);

const previewUrlFor = (photo: ListingPhotoLike) => {
  if (!photo) {
    return null;
  }
  if (!isOptimizedPhoto(photo)) {
    return photo.url;
  }
  const thumbWebp = photo.variants
    ?.filter((v) => v.kind === "THUMBNAIL" && v.format === "webp")
    .sort((a, b) => b.width - a.width)[0];
  if (thumbWebp) {
    return keyToUrl(thumbWebp.key);
  }
  const thumbAvif = photo.variants
    ?.filter((v) => v.kind === "THUMBNAIL" && v.format === "avif")
    .sort((a, b) => b.width - a.width)[0];
  if (thumbAvif) {
    return keyToUrl(thumbAvif.key);
  }
  const responsiveWebp = photo.variants
    ?.filter((v) => v.kind === "RESPONSIVE" && v.format === "webp")
    .sort((a, b) => a.width - b.width)[0];
  if (responsiveWebp) {
    return keyToUrl(responsiveWebp.key);
  }
  return null;
};

const srcSetsFor = (photo: ListingOptimizedPhotoLike) => {
  const responsiveAvif = (photo.variants ?? [])
    .filter((v) => v.kind === "RESPONSIVE" && v.format === "avif")
    .sort((a, b) => a.width - b.width)
    .map((v) => {
      const url = keyToUrl(v.key);
      return url ? `${url} ${v.width}w` : null;
    })
    .filter(Boolean)
    .join(", ");

  const responsiveWebp = (photo.variants ?? [])
    .filter((v) => v.kind === "RESPONSIVE" && v.format === "webp")
    .sort((a, b) => a.width - b.width)
    .map((v) => {
      const url = keyToUrl(v.key);
      return url ? `${url} ${v.width}w` : null;
    })
    .filter(Boolean)
    .join(", ");

  const fallback =
    (photo.variants ?? [])
      .filter((v) => v.kind === "RESPONSIVE" && v.format === "webp")
      .sort((a, b) => b.width - a.width)
      .map((v) => keyToUrl(v.key))
      .find(Boolean) ??
    (photo.variants ?? [])
      .filter((v) => v.kind === "RESPONSIVE" && v.format === "avif")
      .sort((a, b) => b.width - a.width)
      .map((v) => keyToUrl(v.key))
      .find(Boolean) ??
    null;

  return { avif: responsiveAvif || null, webp: responsiveWebp || null, fallback };
};

type ListingPhotosFieldProps = {
  listingId?: string;
  photos: ListingPhotoLike[];
  pendingFiles?: File[];
  onPendingFilesChange?: (files: File[]) => void;
  onListingUpdated?: (listing: ListingInput) => void;
};

export function ListingPhotosField(props: ListingPhotosFieldProps) {
  const { listingId, photos, pendingFiles, onPendingFilesChange, onListingUpdated } = props;
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [localOrder, setLocalOrder] = useState<string[]>([]);
  const [isOrderDirty, setIsOrderDirty] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const pendingOrderSave = useRef<number | null>(null);
  const swipeStartX = useRef<number | null>(null);

  const optimizedPhotos = useMemo(
    () => (photos ?? []).filter(isOptimizedPhoto),
    [photos],
  );

  const optimizedIds = useMemo(
    () => optimizedPhotos.map((p) => p.id),
    [optimizedPhotos],
  );

  useEffect(() => {
    setLocalOrder(optimizedIds);
    setIsOrderDirty(false);
    setActiveId((prev) => {
      if (prev && optimizedIds.includes(prev)) {
        return prev;
      }
      return optimizedIds[0] ?? null;
    });
  }, [optimizedIds]);

  const activePhoto = useMemo(() => {
    if (!activeId) {
      return null;
    }
    return optimizedPhotos.find((p) => p.id === activeId) ?? null;
  }, [activeId, optimizedPhotos]);

  const moveActive = (direction: -1 | 1) => {
    if (!localOrder.length) {
      return;
    }
    const currentIndex = activeId ? localOrder.indexOf(activeId) : -1;
    const nextIndex =
      currentIndex < 0 ? 0 : (currentIndex + direction + localOrder.length) % localOrder.length;
    const nextId = localOrder[nextIndex] ?? null;
    if (nextId) {
      setActiveId(nextId);
    }
  };

  useEffect(() => {
    if (!listingId || !isOrderDirty) {
      return;
    }
    if (pendingOrderSave.current) {
      window.clearTimeout(pendingOrderSave.current);
    }
    pendingOrderSave.current = window.setTimeout(() => {
      if (!localOrder.length) {
        return;
      }
      if (localOrder.length !== optimizedIds.length) {
        return;
      }
      const currentSorted = [...optimizedIds].sort().join(",");
      const nextSorted = [...localOrder].sort().join(",");
      if (currentSorted !== nextSorted) {
        return;
      }
      startTransition(async () => {
        try {
          const updated = await reorderListingPhotosAction({
            listingId,
            photoIds: localOrder,
          });
          onListingUpdated?.(updated);
          setIsOrderDirty(false);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Unable to save photo order.");
        }
      });
    }, 400);

    return () => {
      if (pendingOrderSave.current) {
        window.clearTimeout(pendingOrderSave.current);
      }
    };
  }, [localOrder, listingId, optimizedIds, isOrderDirty, onListingUpdated, startTransition]);

  const validateFiles = (files: File[], currentCount: number) => {
    if (!files.length) {
      return null;
    }
    const remaining = MAX_COUNT - currentCount;
    if (files.length > remaining) {
      return `You can add ${remaining} more photo(s) (max ${MAX_COUNT}).`;
    }
    for (const file of files) {
      if (!ALLOWED_TYPES.has(file.type)) {
        return "Unsupported file type. Allowed: JPEG, PNG, HEIC/HEIF.";
      }
      if (file.size > MAX_BYTES) {
        return `Each image must be <= ${(MAX_BYTES / (1024 * 1024)).toFixed(0)} MB.`;
      }
    }
    return null;
  };

  const uploadAndIngest = async (files: File[]) => {
    if (!listingId) {
      return;
    }
    const stagedKeys = await stageListingPhotos({ listingId, files });
    const updated = await ingestListingPhotosAction({
      listingId,
      stagedKeys,
    });
    onListingUpdated?.(updated);
  };

  const onAddFiles = async (files: File[]) => {
    setError(null);
    const currentCount = (photos?.length ?? 0) + (pendingFiles?.length ?? 0);
    const validationError = validateFiles(files, currentCount);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!listingId) {
      const next = [...(pendingFiles ?? []), ...files];
      onPendingFilesChange?.(next);
      return;
    }

    startTransition(async () => {
      try {
        await uploadAndIngest(files);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to upload photos.");
      }
    });
  };

  const onDelete = (photoId: string) => {
    if (!listingId) {
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const updated = await deleteListingPhotoAction({ listingId, photoId });
        onListingUpdated?.(updated);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to delete photo.");
      }
    });
  };

  const onReplace = (photoId: string, file: File) => {
    if (!listingId) {
      return;
    }
    setError(null);

    const validationError = validateFiles([file], photos?.length ?? 0);
    if (validationError) {
      setError(validationError);
      return;
    }

    startTransition(async () => {
      try {
        const [stagedKey] = await stageListingPhotos({ listingId, files: [file] });
        if (!stagedKey) {
          throw new Error("Upload failed.");
        }
        const updated = await replaceListingPhotoAction({ listingId, photoId, stagedKey });
        onListingUpdated?.(updated);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to replace photo.");
      }
    });
  };

  const pendingPreviews = useMemo(() => {
    if (!pendingFiles?.length) {
      return [];
    }
    return pendingFiles.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));
  }, [pendingFiles]);

  useEffect(() => {
    return () => {
      pendingPreviews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [pendingPreviews]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Photos (up to {MAX_COUNT})
          </p>
          <p className="text-xs text-muted-foreground">
            Uploads are optimized (AVIF + WebP, responsive sizes). Originals are
            discarded and cannot be recovered.
          </p>
        </div>

        {listingId ? (
          <div className="flex flex-wrap gap-2">
            <a
              href={`/listings/${listingId}/photos.zip`}
              className={cn(
                "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
                "bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2",
              )}
              aria-label="Download all listing photos as a ZIP"
            >
              <Download className="mr-2 h-4 w-4" />
              Download ZIP
            </a>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <ImagePlus className="h-4 w-4" />
          Add photos
          <input
            type="file"
            className="hidden"
            multiple
            accept="image/jpeg,image/png,image/heic,image/heif"
            onChange={(e) => {
              const files = Array.from(e.currentTarget.files ?? []);
              e.currentTarget.value = "";
              void onAddFiles(files);
            }}
          />
        </label>
        <p className="text-xs text-muted-foreground">
          Drag to reorder. First photo is used as the listing thumbnail.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      {activePhoto ? (
        <div
          className="overflow-hidden rounded-xl border bg-card"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              moveActive(-1);
            }
            if (e.key === "ArrowRight") {
              e.preventDefault();
              moveActive(1);
            }
          }}
        >
          <div
            className="relative aspect-[16/10] bg-muted"
            onPointerDown={(e) => {
              swipeStartX.current = e.clientX;
            }}
            onPointerUp={(e) => {
              const startX = swipeStartX.current;
              swipeStartX.current = null;
              if (startX == null) {
                return;
              }
              const delta = e.clientX - startX;
              if (Math.abs(delta) < 40) {
                return;
              }
              moveActive(delta > 0 ? -1 : 1);
            }}
          >
            {activePhoto.status === "READY" ? (
              (() => {
                const sets = srcSetsFor(activePhoto);
                const alt = activePhoto.alt ?? "Listing photo";
                if (!sets.fallback) {
                  return (
                    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                      No preview available
                    </div>
                  );
                }
                return (
                  <picture>
                    {sets.avif ? <source type="image/avif" srcSet={sets.avif} /> : null}
                    {sets.webp ? <source type="image/webp" srcSet={sets.webp} /> : null}
                    <img
                      src={sets.fallback}
                      alt={alt}
                      className="h-full w-full object-cover"
                      sizes="(max-width: 768px) 100vw, 720px"
                    />
                  </picture>
                );
              })()
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                {activePhoto.status === "PROCESSING" ? "Processing…" : "Failed to process"}
              </div>
            )}

            <button
              type="button"
              onClick={() => moveActive(-1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur hover:bg-black/60"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => moveActive(1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur hover:bg-black/60"
              aria-label="Next photo"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto border-t bg-card p-2">
            {optimizedPhotos.map((photo, idx) => {
              const thumb = previewUrlFor(photo);
              const selected = photo.id === activeId;
              return (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setActiveId(photo.id)}
                  className={cn(
                    "relative h-14 w-14 shrink-0 overflow-hidden rounded-md border",
                    selected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : null,
                  )}
                  aria-label={`View photo ${idx + 1}`}
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={photo.alt ?? `Listing photo ${idx + 1}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      —
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {pendingPreviews.length ? (
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs font-medium text-muted-foreground">
            Pending (uploads after you create the listing)
          </p>
          <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
            {pendingPreviews.map((item) => (
              <div key={item.url} className="aspect-square overflow-hidden rounded-md border">
                <img src={item.url} alt={item.name} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      ) : null}

	      {optimizedPhotos.length ? (
	        <Reorder.Group
	          axis="y"
	          values={localOrder}
	          onReorder={(next) => {
	            setLocalOrder(next);
	            setIsOrderDirty(true);
	          }}
	          className="space-y-2"
	        >
          {localOrder.map((id, index) => {
            const photo = optimizedPhotos.find((p) => p.id === id);
            if (!photo) {
              return null;
            }
            const preview = previewUrlFor(photo);
            const downloadHref = listingId
              ? `/listings/${listingId}/photos/${photo.id}/download`
              : undefined;

            return (
              <Reorder.Item
                key={photo.id}
                value={photo.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm",
                  photo.status === "FAILED" ? "border-red-200 dark:border-red-900/60" : null,
                )}
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <span className="w-6 text-xs font-semibold text-muted-foreground">
                    {index + 1}
                  </span>
                </div>

                <div className="h-16 w-16 overflow-hidden rounded-lg border bg-muted">
                  {preview ? (
                    <img
                      src={preview}
                      alt={photo.alt ?? `Listing photo ${index + 1}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      No preview
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {photo.status === "READY"
                      ? "Ready"
                      : photo.status === "PROCESSING"
                        ? "Processing…"
                        : "Failed"}
                  </p>
                  {photo.error ? (
                    <p className="truncate text-xs text-red-600 dark:text-red-400">
                      {photo.error}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Optimized variants stored</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {downloadHref ? (
                    <a
                      href={downloadHref}
                      className={cn(
                        "inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium",
                        "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                      )}
                      aria-label={`Download photo ${index + 1}`}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </a>
                  ) : null}

                  <label
                    className={cn(
                      "inline-flex h-9 cursor-pointer items-center justify-center rounded-md px-3 text-sm font-medium",
                      "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                    )}
                    aria-label={`Replace photo ${index + 1}`}
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Replace
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/heic,image/heif"
                      onChange={(e) => {
                        const file = e.currentTarget.files?.[0];
                        e.currentTarget.value = "";
                        if (file) {
                          onReplace(photo.id, file);
                        }
                      }}
                    />
                  </label>

                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(photo.id)}
                    disabled={isPending}
                    aria-label={`Delete photo ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      ) : (
        <div className="rounded-xl border border-dashed bg-muted/10 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No photos yet. Add up to {MAX_COUNT} images.
          </p>
        </div>
      )}
    </div>
  );
}
