import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { reportServerError } from "@/lib/sentry-report-server";
import { getR2Client, isR2Configured } from "./r2-client";
import type {
  StorageBackend,
  UploadParams,
  UploadResult,
} from "./storage-types";

// ── Constants ──────────────────────────────────────────────────

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
  "application/pdf",
] as const;

// ── Key generation ─────────────────────────────────────────────

function generateKey(
  orgId: string,
  fileName: string,
  entityType: string,
  entityId?: string,
): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "bin";
  const uuid = crypto.randomUUID();
  const id = entityId ?? "_";
  return `${orgId}/${entityType}/${id}/${uuid}.${ext}`;
}

// ── R2 Storage backend ─────────────────────────────────────────

/**
 * R2 backend uploads server-side via S3 SDK.
 * For client-direct uploads (presigned URL flow), use the legacy r2-service.ts directly.
 */
export const r2Backend: StorageBackend = {
  async upload(
    params: UploadParams,
    fileBuffer: ArrayBuffer,
  ): Promise<UploadResult> {
    if (!isR2Configured()) {
      throw new Error(
        "R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.",
      );
    }

    const client = getR2Client();
    const bucket = process.env.R2_BUCKET;
    if (!bucket) throw new Error("Missing R2_BUCKET env var");
    const key = generateKey(
      params.orgId,
      params.fileName,
      params.entityType,
      params.entityId,
    );

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: new Uint8Array(fileBuffer),
        ContentType: params.mimeType,
      }),
    );

    // R2 doesn't have public URLs — generate a presigned download URL
    const presignedUrl = await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: 3600 }, // 1 hour
    );

    return { url: presignedUrl, path: key, bucket };
  },

  async delete(urlOrPath: string): Promise<void> {
    if (!isR2Configured()) {
      throw new Error("R2 is not configured");
    }

    const client = getR2Client();
    const bucket = process.env.R2_BUCKET;
    if (!bucket) throw new Error("Missing R2_BUCKET env var");
    const key = extractKey(urlOrPath);

    try {
      await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    } catch {
      reportServerError("Unexpected error");
      return; // Object doesn't exist — no-op
    }

    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  },

  getPublicUrl(path: string, _bucket?: string): string {
    // R2 doesn't have public URLs — return as-is.
    // For display, use the presigned URL from upload() result.
    return path;
  },

  validateUpload(
    fileName: string,
    mimeType: string,
    fileSize: number,
  ): string | null {
    if (!fileName || fileName.length === 0) {
      return "File name is required";
    }
    if (
      !ALLOWED_MIME_TYPES.includes(
        mimeType as (typeof ALLOWED_MIME_TYPES)[number],
      )
    ) {
      return `File type ${mimeType} is not allowed. Accepted: JPEG, PNG, WebP, AVIF, HEIC, HEIF, PDF`;
    }
    if (fileSize > MAX_FILE_SIZE) {
      return `File size ${Math.round(fileSize / 1024 / 1024)}MB exceeds limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }
    if (fileSize === 0) {
      return "File is empty";
    }
    return null;
  },
};

// ── Internal helpers ───────────────────────────────────────────

/**
 * Extract R2 key from a URL or raw key.
 * Accepts: full presigned URL, r2: prefixed key, or raw key.
 */
function extractKey(urlOrPath: string): string {
  // R2 legacy key
  if (urlOrPath.startsWith("r2:")) {
    return urlOrPath.slice(3);
  }

  // Presigned URL — extract key from path
  if (urlOrPath.includes("r2.cloudflarestorage.com")) {
    const url = new URL(urlOrPath);
    return url.pathname.slice(1); // Remove leading /
  }

  // Raw key
  return urlOrPath;
}
