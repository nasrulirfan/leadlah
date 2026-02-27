import { BadRequestException, Controller, Get, Query, Res } from "@nestjs/common";
import type { Response } from "express";
import { r2Fetch } from "../storage/r2";

const allowedKeyPattern =
  /^listings\/[0-9a-f-]{36}\/photos\/v1\/[0-9a-f]{64}\/(thumb\.(avif|webp)|\d+\.(avif|webp))$/i;

const contentTypeForKey = (key: string) => {
  if (key.toLowerCase().endsWith(".avif")) {
    return "image/avif";
  }
  if (key.toLowerCase().endsWith(".webp")) {
    return "image/webp";
  }
  return "application/octet-stream";
};

@Controller("media")
export class MediaController {
  @Get("r2")
  async r2Object(@Query("key") key: string, @Res() res: Response) {
    if (!key || typeof key !== "string" || !allowedKeyPattern.test(key)) {
      throw new BadRequestException("Invalid media key.");
    }

    const response = await r2Fetch({ method: "GET", key });
    if (!response.ok || !response.body) {
      res.status(response.status === 404 ? 404 : 502).end();
      return;
    }

    const contentType = response.headers.get("content-type") ?? contentTypeForKey(key);
    const contentLength = response.headers.get("content-length");

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Cache-Control",
      process.env.NODE_ENV === "production"
        ? "public, max-age=31536000, immutable"
        : "no-store",
    );
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
    }

    const reader = response.body.getReader();
    try {
      let result = await reader.read();
      while (!result.done) {
        if (result.value) {
          res.write(Buffer.from(result.value));
        }
        result = await reader.read();
      }
    } finally {
      reader.releaseLock();
    }

    res.end();
  }
}
