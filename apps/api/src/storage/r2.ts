import crypto from "crypto";

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  region: string;
  endpoint: string;
};

const encodeRfc3986 = (value: string) =>
  encodeURIComponent(value).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );

const sha256Hex = (value: string | Uint8Array) =>
  crypto.createHash("sha256").update(value).digest("hex");

const hmac = (key: Buffer | string, value: string) =>
  crypto.createHmac("sha256", key).update(value, "utf8").digest();

const formatAmzDate = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
};

const formatDateStamp = (date: Date) => formatAmzDate(date).slice(0, 8);

const canonicalizeQuery = (params: Record<string, string>) =>
  Object.keys(params)
    .sort()
    .map((key) => `${encodeRfc3986(key)}=${encodeRfc3986(params[key] ?? "")}`)
    .join("&");

const canonicalizeHeaders = (headers: Record<string, string>) => {
  const entries = Object.entries(headers)
    .map(([key, value]) => [key.toLowerCase(), value.trim().replace(/\s+/g, " ")] as const)
    .sort(([a], [b]) => a.localeCompare(b));

  return {
    canonical: entries.map(([k, v]) => `${k}:${v}\n`).join(""),
    signedHeaders: entries.map(([k]) => k).join(";"),
  };
};

const canonicalizePath = (path: string) =>
  path
    .split("/")
    .map((segment) => encodeRfc3986(segment))
    .join("/")
    .replace(/%2F/g, "/");

const signingKey = (cfg: R2Config, dateStamp: string) => {
  const kDate = hmac(`AWS4${cfg.secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, cfg.region);
  const kService = hmac(kRegion, "s3");
  return hmac(kService, "aws4_request");
};

const buildAuthorizationHeader = (params: {
  cfg: R2Config;
  method: string;
  canonicalUri: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  payloadHash: string;
  now: Date;
}) => {
  const { cfg, method, canonicalUri, query, headers, payloadHash, now } = params;
  const amzDate = formatAmzDate(now);
  const dateStamp = formatDateStamp(now);

  const { canonical: canonicalHeaders, signedHeaders } = canonicalizeHeaders(headers);
  const canonicalQuery = canonicalizeQuery(query);

  const canonicalRequest = [
    method.toUpperCase(),
    canonicalizePath(canonicalUri),
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${cfg.region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const signature = crypto
    .createHmac("sha256", signingKey(cfg, dateStamp))
    .update(stringToSign, "utf8")
    .digest("hex");

  return `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
};

export function getR2Config(): R2Config {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const region = process.env.R2_REGION ?? "auto";

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error(
      "R2 config missing. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET.",
    );
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    region,
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  };
}

export function r2ObjectUrl(key: string) {
  const base = process.env.R2_PUBLIC_BASE_URL;
  if (!base) {
    return null;
  }
  return `${base.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
}

export async function r2Fetch(params: {
  method: "GET" | "PUT" | "HEAD" | "DELETE";
  key: string;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  body?: Uint8Array;
}) {
  const cfg = getR2Config();
  const now = new Date();
  const query = params.query ?? {};
  const headers: Record<string, string> = {
    ...(params.headers ?? {}),
  };

  const url = new URL(`${cfg.endpoint}/${cfg.bucket}/${params.key.replace(/^\//, "")}`);
  Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));

  const body =
    params.body != null
      ? (() => {
          const buffer = params.body.buffer;
          if (buffer instanceof ArrayBuffer) {
            return buffer.slice(
              params.body.byteOffset,
              params.body.byteOffset + params.body.byteLength,
            );
          }
          const copy = new Uint8Array(params.body.byteLength);
          copy.set(params.body);
          return copy.buffer;
        })()
      : undefined;

  headers.host = url.host;
  headers["x-amz-date"] = formatAmzDate(now);
  headers["x-amz-content-sha256"] = params.body ? sha256Hex(params.body) : sha256Hex("");

  headers.authorization = buildAuthorizationHeader({
    cfg,
    method: params.method,
    canonicalUri: `/${cfg.bucket}/${params.key.replace(/^\//, "")}`,
    query,
    headers,
    payloadHash: headers["x-amz-content-sha256"],
    now,
  });

  const response = await fetch(url, {
    method: params.method,
    headers,
    body,
  });

  return response;
}

export function r2PresignedPutUrl(params: {
  key: string;
  expiresSeconds: number;
}) {
  const cfg = getR2Config();
  const now = new Date();
  const amzDate = formatAmzDate(now);
  const dateStamp = formatDateStamp(now);
  const credentialScope = `${dateStamp}/${cfg.region}/s3/aws4_request`;

  const host = `${cfg.accountId}.r2.cloudflarestorage.com`;
  const canonicalUri = `/${cfg.bucket}/${params.key.replace(/^\//, "")}`;

  const query: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${cfg.accessKeyId}/${credentialScope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(params.expiresSeconds),
    "X-Amz-SignedHeaders": "host",
  };

  const canonicalRequest = [
    "PUT",
    canonicalizePath(canonicalUri),
    canonicalizeQuery(query),
    `host:${host}\n`,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const signature = crypto
    .createHmac("sha256", signingKey(cfg, dateStamp))
    .update(stringToSign, "utf8")
    .digest("hex");

  query["X-Amz-Signature"] = signature;

  const url = new URL(`${cfg.endpoint}${canonicalUri}`);
  Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}

export function r2PresignedGetUrl(params: {
  key: string;
  expiresSeconds: number;
  responseContentDisposition?: string;
}) {
  const cfg = getR2Config();
  const now = new Date();
  const amzDate = formatAmzDate(now);
  const dateStamp = formatDateStamp(now);
  const credentialScope = `${dateStamp}/${cfg.region}/s3/aws4_request`;

  const host = `${cfg.accountId}.r2.cloudflarestorage.com`;
  const canonicalUri = `/${cfg.bucket}/${params.key.replace(/^\//, "")}`;

  const query: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${cfg.accessKeyId}/${credentialScope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(params.expiresSeconds),
    "X-Amz-SignedHeaders": "host",
  };

  if (params.responseContentDisposition) {
    query["response-content-disposition"] = params.responseContentDisposition;
  }

  const canonicalRequest = [
    "GET",
    canonicalizePath(canonicalUri),
    canonicalizeQuery(query),
    `host:${host}\n`,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const signature = crypto
    .createHmac("sha256", signingKey(cfg, dateStamp))
    .update(stringToSign, "utf8")
    .digest("hex");

  query["X-Amz-Signature"] = signature;

  const url = new URL(`${cfg.endpoint}${canonicalUri}`);
  Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}
