import { createSimpleRouteHandler } from "@/lib/api-handler";
import { apiError, created } from "@/lib/api-response";
import { reportServerError } from "@/lib/sentry-report-server";
import { importGlobalPartsToOrg } from "@/lib/services/global-catalog-service";

interface ImportBody {
  organizationId: string;
  partIds: string[];
}

export const POST = createSimpleRouteHandler(
  async ({ request, supabase, user }) => {
    let body: ImportBody;
    try {
      body = await request.json();
    } catch {
      return apiError("INVALID_BODY", "Invalid JSON body", 400);
    }

    if (!body.organizationId) {
      return apiError("VALIDATION_ERROR", "organizationId is required", 400);
    }
    if (!body.partIds?.length) {
      return apiError("VALIDATION_ERROR", "partIds must be a non-empty array", 400);
    }

    try {
      const result = await importGlobalPartsToOrg(
        supabase,
        body.organizationId,
        user.id,
        body.partIds,
      );
      return created(result);
    } catch (error) {
      reportServerError("[Global Catalog Import] Error:", error);
      const status =
        error instanceof Error &&
        (error.message.includes("not found") || error.message.includes("required"))
          ? 400
          : 500;
      return apiError("IMPORT_ERROR", error instanceof Error ? error.message : "Import failed", status);
    }
  },
  { rateLimit: true },
);
