import type { OwnerViewToken } from "@leadlah/core";
import { Buffer } from "buffer";

type SerializableOwnerToken = Omit<OwnerViewToken, "expiresAt"> & {
  expiresAt: string;
};

const serializeToken = (token: OwnerViewToken): SerializableOwnerToken => ({
  ...token,
  expiresAt: (token.expiresAt instanceof Date ? token.expiresAt : new Date(token.expiresAt)).toISOString()
});

const toBase64Url = (value: string) =>
  Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const fromBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4;
  const padded = pad ? normalized.concat("=".repeat(4 - pad)) : normalized;
  return Buffer.from(padded, "base64").toString("utf8");
};

export function encodeOwnerViewToken(token: OwnerViewToken): string {
  const payload = JSON.stringify(serializeToken(token));
  return toBase64Url(payload);
}

export function decodeOwnerViewToken(value: string): OwnerViewToken | null {
  try {
    const json = fromBase64Url(value);
    const parsed = JSON.parse(json) as SerializableOwnerToken;
    return {
      ...parsed,
      expiresAt: new Date(parsed.expiresAt)
    };
  } catch {
    return null;
  }
}
