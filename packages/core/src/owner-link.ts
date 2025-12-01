import { Buffer } from "buffer";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { OwnerViewToken } from "./types";

const createSignature = (
  secret: string,
  listingId: string,
  expiresAt: Date,
  salt: string
) => {
  return createHmac("sha256", secret)
    .update(`${listingId}:${expiresAt.getTime()}:${salt}`)
    .digest("hex");
};

export function generateOwnerViewToken(
  listingId: string,
  expiresInDays = 30,
  secret: string
): OwnerViewToken {
  if (!secret) {
    throw new Error("Owner link secret is required.");
  }
  const salt = randomBytes(12).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  const signature = createSignature(secret, listingId, expiresAt, salt);
  return {
    listingId,
    token: `${salt}.${signature}`,
    expiresAt
  };
}

export function verifyOwnerViewToken(
  token: OwnerViewToken,
  listingId: string,
  secret: string
): boolean {
  if (!secret) {
    throw new Error("Owner link secret is required.");
  }
  if (token.listingId !== listingId) {
    return false;
  }
  const expiresAt =
    token.expiresAt instanceof Date ? token.expiresAt : new Date(token.expiresAt);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
    return false;
  }
  const [salt, signature] = token.token.split(".");
  if (!salt || !signature) {
    return false;
  }
  const expected = createSignature(secret, listingId, expiresAt, salt);
  try {
    const left = Buffer.from(signature, "hex");
    const right = Buffer.from(expected, "hex");
    if (left.length !== right.length) {
      return false;
    }
    return timingSafeEqual(left, right);
  } catch {
    return signature === expected;
  }
}
