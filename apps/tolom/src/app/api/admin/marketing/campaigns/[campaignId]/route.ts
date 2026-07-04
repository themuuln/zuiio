import { createRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";
import {
  checkAdminRole,
  deleteCampaign,
  updateCampaign,
} from "@/lib/services/admin-service";

export const PATCH = createRouteHandler(
  async ({ supabase, request, params }) => {
    const hasAccess = await checkAdminRole(supabase, "marketing_manager");
    if (!hasAccess) {
      return apiError("FORBIDDEN", "Marketing manager access required", 403);
    }

    const body = (await request.json()) as {
      name?: string;
      type?: string;
      status?: string;
    };

    const campaign = await updateCampaign(supabase, params.campaignId, body);
    return ok(campaign);
  },
);

export const DELETE = createRouteHandler(async ({ supabase, params }) => {
  const hasAccess = await checkAdminRole(supabase, "marketing_manager");
  if (!hasAccess) {
    return apiError("FORBIDDEN", "Marketing manager access required", 403);
  }

  await deleteCampaign(supabase, params.campaignId);
  return ok({ success: true });
});
