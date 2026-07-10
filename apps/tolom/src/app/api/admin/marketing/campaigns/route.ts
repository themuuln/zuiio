import { createRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";
import {

  checkAdminRole,
  createCampaign,
  listCampaigns,
} from "@/lib/services/admin-service";

export { dynamic } from "@/lib/api-handler";

export const GET = createRouteHandler(async ({ supabase }) => {
  const hasAccess = await checkAdminRole(supabase, "marketing_manager");
  if (!hasAccess) {
    return apiError("FORBIDDEN", "Marketing manager access required", 403);
  }

  const campaigns = await listCampaigns(supabase);
  return ok(campaigns);
});

export const POST = createRouteHandler(async ({ supabase, request }) => {
  const hasAccess = await checkAdminRole(supabase, "marketing_manager");
  if (!hasAccess) {
    return apiError("FORBIDDEN", "Marketing manager access required", 403);
  }

  const body = (await request.json()) as {
    name: string;
    type: string;
    organization_id?: string;
  };

  if (!body.name || !body.type) {
    return apiError("VALIDATION_ERROR", "name and type are required", 400);
  }

  // Get current admin user ID
  const { data: adminUser } = await supabase
    .from("super_admins")
    .select("id")
    .maybeSingle();

  const campaign = await createCampaign(supabase, {
    name: body.name,
    type: body.type,
    organization_id: body.organization_id,
    created_by: adminUser?.id,
  });

  return ok(campaign);
});
