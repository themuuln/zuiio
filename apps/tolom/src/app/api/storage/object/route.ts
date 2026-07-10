import { apiError, createSimpleRouteHandler, ok } from "@/lib/api-response";
import { reportServerError } from "@/lib/sentry-report-server";
import { getStorage } from "@/lib/storage/storage-factory";
/**
 * DELETE /api/storage/object?key=<storage-path-or-url>
 *
 * Deletes an object from Supabase Storage.
 * Accepts full Supabase URLs, raw storage paths, and legacy "r2:"-prefixed keys.
 */
export const DELETE = createSimpleRouteHandler(
  async ({ request }) => {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    if (!key) {
      return apiError("VALIDATION_ERROR", "key query param required", 400);
    }

    try {
      await getStorage().delete(key);
      return ok({ deleted: true });
    } catch (error) {
      reportServerError("Unexpected error", error);
      return apiError(
        "STORAGE_ERROR",
        error instanceof Error ? error.message : "Failed to delete object",
        500,
      );
    }
  },
  { rateLimit: true },
);
