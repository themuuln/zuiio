import { createRouteHandler } from "@/lib/api-handler";
import { ok, apiError, noContent } from "@/lib/api-response";
import {
  deleteEstimate,
  getEstimate,
  updateEstimate,
} from "@/lib/services/estimate-service";

export const GET = createRouteHandler(
  async ({ params, supabase, orgId }) => {
    const estimate = await getEstimate(supabase, params.estimateId, orgId);
    if (!estimate) {
      return apiError("NOT_FOUND", "Estimate not found", 404);
    }
    return ok(estimate);
  },
  { requiredPermission: { resource: "work_orders", action: "read" } },
);

export const PATCH = createRouteHandler(
  async ({ request, params, orgId, supabase }) => {
    const body = await request.json();
    const estimate = await updateEstimate(
      supabase,
      params.estimateId,
      orgId,
      body,
    );
    return ok(estimate);
  },
  {
    rateLimit: true,
    requiredPermission: { resource: "work_orders", action: "update" },
  },
);

export const DELETE = createRouteHandler(
  async ({ request, params, orgId, supabase }) => {
    await deleteEstimate(supabase, params.estimateId, orgId);
    return noContent();
  },
  {
    rateLimit: true,
    requiredPermission: { resource: "work_orders", action: "delete" },
  },
);
