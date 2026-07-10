import { apiError, createSimpleRouteHandler, ok } from "@/lib/api-response";
import { reportServerError } from "@/lib/sentry-report-server";
import { getStorage } from "@/lib/storage/storage-factory";

/**
 * GET /api/storage/download?key=<storage-path-or-url>
 *
 * Returns the public URL for a Supabase Storage object.
 * Accepts raw storage paths, full Supabase URLs, and legacy "r2:"-prefixed keys.
 */
export const GET = createSimpleRouteHandler(
  async ({ request }) => {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    if (!key) {
      return apiError("VALIDATION_ERROR", "key query param required", 400);
    }

    try {
      // For Supabase public URLs, return directly
      if (key.includes("/storage/v1/object/public/")) {
        return ok({ url: key });
      }

      // For raw paths or legacy r2: keys, get public URL from storage backend
      const storage = getStorage();
      const path = key.startsWith("r2:") ? key.slice(3) : key;
      const parts = path.split("/");
      const entityType = parts[1] ?? "parts";
      const bucketMap: Record<string, string> = {
        parts: "part-photos",
        "work-orders": "work-order-photos",
        logos: "org-logos",
      };
      const bucket = bucketMap[entityType] ?? "part-photos";

      const url = storage.getPublicUrl(path, bucket);
      return ok({ url });
    } catch (error) {
    reportServerError("Unexpected error", error);
      return apiError(
        "STORAGE_ERROR",
        error instanceof Error
          ? error.message
          : "Failed to generate download URL",
        500,
      );
    }
  },
  { requireAuth: false },
);
