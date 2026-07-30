import { createRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";
import { getGlobalPartById } from "@/lib/services/global-catalog-service";

export const GET = createRouteHandler(
  async ({ params, supabase }) => {
    const partId = params.partId;

    try {
      const data = await getGlobalPartById(supabase, partId);
      return ok(data);
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        return apiError("NOT_FOUND", error.message, 404);
      }
      return apiError("QUERY_ERROR", "Failed to fetch part", 500);
    }
  },
  { requireOrg: false },
);
