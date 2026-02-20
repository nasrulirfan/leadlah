import type { ExternalLink, Listing } from "@leadlah/core";
import type { ListingEntity } from "./entities/listing.entity";

export function normalizeExternalLinks(links: ExternalLink[] | null | undefined) {
  return (links ?? []).map((link) => ({
    ...link,
    expiresAt: link.expiresAt ?? undefined,
  }));
}

export function listingEntityToListing(entity: ListingEntity): Listing {
  return {
    id: entity.id,
    propertyName: entity.propertyName,
    lotUnitNo: entity.lotUnitNo ?? undefined,
    type: entity.type,
    category: entity.category,
    price: Number(entity.price),
    bankValue: entity.bankValue == null ? undefined : Number(entity.bankValue),
    competitorPriceRange: entity.competitorPriceRange ?? undefined,
    size: Number(entity.size),
    bedrooms: entity.bedrooms,
    bathrooms: entity.bathrooms,
    location: entity.location,
    buildingProject: entity.buildingProject ?? undefined,
    status: entity.status,
    expiresAt: entity.expiresAt ?? undefined,
    lastEnquiryAt: entity.lastEnquiryAt ?? undefined,
    photos: entity.photos ?? [],
    videos: entity.videos ?? [],
    documents: entity.documents ?? [],
    externalLinks: normalizeExternalLinks(entity.externalLinks),
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

