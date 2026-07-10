import { createRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";
/**
 * GET /api/estimate/public/[token]
 *
 * Public endpoint — requires auth. Returns estimate data by public token.
 */
export const GET = createRouteHandler(
  async ({ params, supabase }) => {
    const { token } = params;

    const { data: estimateData, error } = await supabase.rpc(
      "get_public_estimate_by_token",
      { p_token: token },
    );

    if (error || !estimateData) {
      return apiError("NOT_FOUND", "Estimate not found", 404);
    }

    const estimate = estimateData as {
      id: string;
      items: Array<Record<string, unknown>>;
      [key: string]: unknown;
    };
    const items = estimate.items ?? [];
    const sortedItems = items.sort(
      (a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0),
    );
    return ok({ ...estimate, items: sortedItems });
  },
  { requireOrg: false },
);
