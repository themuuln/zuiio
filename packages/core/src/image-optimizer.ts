/**
 * Server-side image optimization using sharp.
 *
 * Use in API routes to resize, convert formats, and compress images
 * before storing them in Supabase Storage or generating thumbnails.
 *
 * Can only run in the Node.js runtime (not Edge).
 *
 * @module
 */

import type { OutputInfo as SharpOutputInfo } from "sharp";

export type { SharpOutputInfo };

export interface ImageOptimizeOptions {
  /** Max width in pixels (default: no resize) */
  maxWidth?: number;
  /** Max height in pixels (default: no resize) */
  maxHeight?: number;
  /** Output format (default: keep original) */
  format?: "jpeg" | "png" | "webp" | "avif";
  /** JPEG/WebP/AVIF quality 1-100 (default: 80) */
  quality?: number;
  /** Strip EXIF metadata (default: true) */
  stripMetadata?: boolean;
}

const DEFAULT_OPTIONS: Required<ImageOptimizeOptions> = {
  maxWidth: 1920,
  maxHeight: 1080,
  format: "webp",
  quality: 80,
  stripMetadata: true,
};

/**
 * Optimize a buffer (e.g., from an uploaded file) using sharp.
 *
 * Returns the optimized buffer and metadata for storage.
 *
 * @example
 * ```ts
 * import { optimizeImage } from "@zuiio/core";
 *
 * const { data } = await optimizeImage(fileBuffer, {
 *   maxWidth: 1200,
 *   format: "webp",
 *   quality: 75,
 * });
 *
 * await supabase.storage.from("photos").upload(path, data);
 * ```
 */
export async function optimizeImage(
  input: Buffer,
  options?: ImageOptimizeOptions,
): Promise<{ data: Buffer; info: SharpOutputInfo }> {
  const { default: sharp } = await import("sharp");

  const opts = { ...DEFAULT_OPTIONS, ...options };
  let pipeline = sharp(input);

  if (!opts.stripMetadata) {
    pipeline = pipeline.withMetadata({});
  }

  pipeline = pipeline.resize({
    width: opts.maxWidth,
    height: opts.maxHeight,
    fit: "inside",
    withoutEnlargement: true,
  });

  switch (opts.format) {
    case "jpeg":
      pipeline = pipeline.jpeg({ quality: opts.quality });
      break;
    case "png":
      pipeline = pipeline.png({ quality: opts.quality });
      break;
    case "webp":
      pipeline = pipeline.webp({ quality: opts.quality });
      break;
    case "avif":
      pipeline = pipeline.avif({ quality: opts.quality });
      break;
  }

  const data = await pipeline.toBuffer();
  const info = await sharp(data).metadata();
  const outputInfo: SharpOutputInfo = {
    format: opts.format,
    size: data.length,
    width: info.width ?? 0,
    height: info.height ?? 0,
    channels: info.channels ?? 4,
    hasAlpha: info.hasAlpha ?? false,
    premultiplied: false,
  };

  return { data, info: outputInfo };
}

/**
 * Generate a square thumbnail from an image buffer.
 *
 * @example
 * ```ts
 * const thumb = await generateThumbnail(fileBuffer, 150);
 * ```
 */
export async function generateThumbnail(
  input: Buffer,
  size: number = 200,
): Promise<{ data: Buffer; info: SharpOutputInfo }> {
  return optimizeImage(input, {
    maxWidth: size,
    maxHeight: size,
    format: "webp",
    quality: 70,
  });
}
