import { z } from "zod";
import { apiError, createSimpleRouteHandler, ok } from "@/lib/api-response";
import { reportServerError } from "@/lib/sentry-report-server";
import {
  generatePresignedUploadUrl,
  validateUploadRequest,
} from "@/lib/storage/r2-service";

const presignedUrlSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().positive(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
});

/**
 * POST /api/storage/presigned-url
 *
 * Returns a presigned PUT URL for direct browser-to-R2 upload.
 * Client then PUTs the file directly to R2 — server never handles bytes.
 *
 * Request: { fileName, mimeType, fileSize, entityType?, entityId? }
 * Response: { data: { presignedUrl, key, expiresAt } }
 */
export const POST = createSimpleRouteHandler(
  async ({ request, user, supabase }) => {
    const body = await request.json();
    const parsed = presignedUrlSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        parsed.error.issues.map((i) => i.message).join(", "),
        400,
      );
    }

    const { fileName, mimeType, fileSize, entityType, entityId } = parsed.data;

    const validationError = validateUploadRequest(fileName, mimeType, fileSize);
    if (validationError) {
      return apiError("VALIDATION_ERROR", validationError, 400);
    }

    // Derive orgId from authenticated user's membership — never trust client headers
    const { data: membership, error: membershipErr } = await supabase
      .from("organization_users")
      .select("organization_id")
      .eq("user_id", user.id)
      .is("removed_at", null)
      .maybeSingle();

    if (membershipErr || !membership) {
      return apiError("FORBIDDEN", "Not a member of any organization", 403);
    }

    try {
      const result = await generatePresignedUploadUrl({
        orgId: membership.organization_id,
        fileName,
        mimeType,
        entityType,
        entityId,
      });
      return ok(result);
    } catch (error) {
      reportServerError("Unexpected error", error);
      return apiError(
        "STORAGE_ERROR",
        error instanceof Error
          ? error.message
          : "Failed to generate upload URL",
        500,
      );
    }
  },
  { rateLimit: true },
);
