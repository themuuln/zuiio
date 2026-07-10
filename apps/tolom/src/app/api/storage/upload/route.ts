import { z } from "zod";
import { reportServerError } from "@/lib/sentry-report-server";
import { apiError, createSimpleRouteHandler, ok } from "@/lib/api-response";
import { getStorage } from "@/lib/storage/storage-factory";

const uploadMetadataSchema = z.object({
  orgId: z.string().uuid(),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().positive(),
  entityType: z.string().min(1),
  entityId: z.string().optional(),
});

/**
 * POST /api/storage/upload
 *
 * Accepts multipart form data: file + metadata JSON.
 * Server uploads to Supabase Storage and returns the public URL.
 *
 * FormData fields:
 *   - file: the file to upload
 *   - metadata: JSON string with { orgId, fileName, mimeType, fileSize, entityType, entityId? }
 *
 * Response: { data: { url, path, bucket } }
 */
export const POST = createSimpleRouteHandler(async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const metadataRaw = formData.get("metadata") as string | null;

    if (!file) {
      return apiError("VALIDATION_ERROR", "No file provided", 400);
    }
    if (!metadataRaw) {
      return apiError("VALIDATION_ERROR", "No metadata provided", 400);
    }

    const metadata = JSON.parse(metadataRaw);
    const parsed = uploadMetadataSchema.safeParse(metadata);
    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        parsed.error.issues.map((i) => i.message).join(", "),
        400,
      );
    }

    const { orgId, fileName, mimeType, fileSize, entityType, entityId } =
      parsed.data;

    // Override mimeType with actual file type if metadata says octet-stream
    const actualMimeType =
      file.type && file.type !== "application/octet-stream"
        ? file.type
        : mimeType;

    const storage = getStorage();
    const validationError = storage.validateUpload(fileName, actualMimeType, fileSize);
    if (validationError) {
      return apiError("VALIDATION_ERROR", validationError, 400);
    }

    const buffer = await file.arrayBuffer();

    const result = await storage.upload(
      {
        orgId,
        fileName,
        mimeType: actualMimeType,
        entityType,
        entityId,
      },
      buffer,
    );

    return ok(result);
  } catch (error) {
    reportServerError("Unexpected error", error);
    return apiError(
      "STORAGE_ERROR",
      error instanceof Error ? error.message : "Upload failed",
      500,
    );
  }
});
