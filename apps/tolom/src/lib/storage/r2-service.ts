import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { reportServerError } from "@/lib/sentry-report-server";
import { getR2Client, isR2Configured } from "./r2-client";

// ── Constants ──────────────────────────────────────────────────

const PRESIGNED_UPLOAD_EXPIRY = 300; // 5 minutes
const PRESIGNED_DOWNLOAD_EXPIRY = 3600; // 1 hour
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
  "application/pdf",
];

// ── Key generation ─────────────────────────────────────────────

function generateKey(
  orgId: string,
  fileName: string,
  entityType?: string,
  entityId?: string,
): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "bin";
  const uuid = crypto.randomUUID();
  const entity = entityType ?? "general";
  const id = entityId ?? "_";
  return `${orgId}/${entity}/${id}/${uuid}.${ext}`;
}

// ── Public API ─────────────────────────────────────────────────

export interface PresignedUploadParams {
  orgId: string;
  fileName: string;
  mimeType: string;
  entityType?: string;
  entityId?: string;
}

export interface PresignedUploadResult {
  presignedUrl: string;
  key: string;
  expiresAt: string;
}

/**
 * Validates upload request parameters.
 * Returns an error message string or null if valid.
 */
export function validateUploadRequest(
  fileName: string,
  mimeType: string,
  fileSize: number,
): string | null {
  if (!fileName?.trim()) return "File name is required";
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return `Unsupported file type: ${mimeType}`;
  }
  if (fileSize > MAX_FILE_SIZE) {
    return `File too large: ${(fileSize / 1024 / 1024).toFixed(1)}MB (max 10MB)`;
  }
  return null;
}

/**
 * Generates a presigned PUT URL for direct browser-to-R2 upload.
 *
 * Flow:
 * 1. Client sends { fileName, mimeType, fileSize } to API route
 * 2. API route calls this → returns { presignedUrl, key }
 * 3. Client PUTs file directly to R2 via presignedUrl
 * 4. Client creates attachment record with storage_path = key
 *
 * Server never handles file bytes.
 */
export async function generatePresignedUploadUrl(
  params: PresignedUploadParams,
): Promise<PresignedUploadResult> {
  if (!isR2Configured()) {
    throw new Error(
      "R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.",
    );
  }

  const client = getR2Client();
  const bucket = process.env.R2_BUCKET!;
  const key = generateKey(
    params.orgId,
    params.fileName,
    params.entityType,
    params.entityId,
  );

  const expiresAt = new Date(Date.now() + PRESIGNED_UPLOAD_EXPIRY * 1000);

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: params.mimeType,
  });

  const presignedUrl = await getSignedUrl(client, command, {
    expiresIn: PRESIGNED_UPLOAD_EXPIRY,
  });

  return { presignedUrl, key, expiresAt: expiresAt.toISOString() };
}

/**
 * Generates a presigned GET URL for downloading/viewing an R2 object.
 * Use this for attachments that don't have a public URL.
 */
export async function generatePresignedDownloadUrl(
  key: string,
  expiresIn = PRESIGNED_DOWNLOAD_EXPIRY,
): Promise<string> {
  if (!isR2Configured()) {
    throw new Error("R2 is not configured");
  }

  const client = getR2Client();
  const bucket = process.env.R2_BUCKET!;

  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Deletes an object from R2 by key.
 * Returns true if deleted, false if not found.
 */
export async function deleteR2Object(key: string): Promise<boolean> {
  if (!isR2Configured()) {
    throw new Error("R2 is not configured");
  }

  const client = getR2Client();
  const bucket = process.env.R2_BUCKET!;

  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  } catch {
    reportServerError("Unexpected error");
    return false; // Object doesn't exist
  }

  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  return true;
}

/**
 * Checks if a storage_path is an R2 key (prefixed with "r2:").
 */
export function isR2StoragePath(storagePath: string): boolean {
  return storagePath.startsWith("r2:");
}

/**
 * Strips the "r2:" prefix from a storage_path to get the raw R2 object key.
 */
export function r2KeyFromStoragePath(storagePath: string): string {
  return storagePath.startsWith("r2:") ? storagePath.slice(3) : storagePath;
}

/**
 * Resolves an R2 storage key to a presigned download URL.
 * Returns null if resolution fails (e.g. expired credentials, network error)
 * so the UI can show empty state instead of a broken <img src="r2:...">.
 * Returns the original value unchanged if it's not an R2 key.
 */
export async function resolveR2Url(
  value: string | null,
): Promise<string | null> {
  if (!value || !isR2StoragePath(value)) return value;
  const key = r2KeyFromStoragePath(value);
  try {
    return await generatePresignedDownloadUrl(key);
  } catch {
    reportServerError("Unexpected error");
    return null; // Return null so UI shows empty state, not broken image
  }
}
