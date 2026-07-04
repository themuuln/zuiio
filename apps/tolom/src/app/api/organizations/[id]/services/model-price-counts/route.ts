import { ok } from "@/lib/api-response";
import { createRouteHandler } from "@/lib/api-handler";
import { getServiceModelPriceCounts } from "@/lib/services/service-catalog-service";

/**
 * GET /api/organizations/:id/services/model-price-counts
 * Returns a map of service_catalog_id → count of models with custom prices.
 * Used to avoid N+1 badge queries on the services listing page.
 */
export const GET = createRouteHandler(async ({ orgId, supabase }) => {
  const counts = await getServiceModelPriceCounts(supabase, orgId);
  return ok(counts);
});
