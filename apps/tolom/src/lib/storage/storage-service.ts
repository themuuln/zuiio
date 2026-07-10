import { createServiceRoleClient } from "@/lib/supabase/service-role";
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

// ── Bucket mapping ─────────────────────────────────────────────

const ENTITY_BUCKET_MAP: Record<string, string> = {
  parts: "part-photos",
  "work-orders": "work-order-photos",
  logos: "org-logos",
};

function getBucketForEntity(entityType: string): string {
  return ENTITY_BUCKET_MAP[entityType] ?? "part-photos";
}

// ── Path generation ────────────────────────────────────────────

function generatePath(
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

// ── Supabase Storage backend ───────────────────────────────────

export const supabaseBackend: StorageBackend = {
  async upload(
    params: UploadParams,
    fileBuffer: ArrayBuffer,
  ): Promise<UploadResult> {
    const { orgId, fileName, mimeType, entityType, entityId } = params;
    const bucket = getBucketForEntity(entityType);
    const path = generatePath(orgId, fileName, entityType, entityId);

    const supabase = await createServiceRoleClient();

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(path);

    return { url: publicUrl, path, bucket };
  },

  async delete(urlOrPath: string): Promise<void> {
    const supabase = await createServiceRoleClient();
    const { bucket, path } = parseStoragePath(urlOrPath);

    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  },

  getPublicUrl(path: string, bucket = "part-photos"): string {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
    }
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
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

interface ParsedPath {
  bucket: string;
  path: string;
}

/**
 * Parse a storage path from either a full Supabase URL or a raw path.
 */
function parseStoragePath(urlOrPath: string): ParsedPath {
  // Full Supabase URL
  const storageMatch = urlOrPath.match(
    /\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/,
  );
  if (storageMatch) {
    return { bucket: storageMatch[1], path: storageMatch[2] };
  }

  // R2 legacy key (r2:orgId/parts/...) — extract path after prefix
  if (urlOrPath.startsWith("r2:")) {
    const raw = urlOrPath.slice(3);
    const parts = raw.split("/");
    const entityType = parts[1] ?? "parts";
    return { bucket: getBucketForEntity(entityType), path: raw };
  }

  // Raw path — use default bucket
  return { bucket: "part-photos", path: urlOrPath };
}
