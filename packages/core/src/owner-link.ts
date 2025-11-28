import { createHash, randomBytes } from "crypto";
import { OwnerViewToken } from "./types";

export function generateOwnerViewToken(
  listingId: string,
  expiresInDays = 30
): OwnerViewToken {
  const salt = randomBytes(8).toString("hex");
  const hash = createHash("sha256")
    .update(`${listingId}:${salt}:${Date.now()}`)
    .digest("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  return {
    listingId,
    token: hash,
    expiresAt
  };
}

export function verifyOwnerViewToken(
  token: OwnerViewToken,
  listingId: string
): boolean {
  return token.listingId === listingId && token.expiresAt > new Date();
}
