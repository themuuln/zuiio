import { createRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";
import {

  assignSellerToOrg,
  checkSuperAdmin,
} from "@/lib/services/admin-service";
export const POST = createRouteHandler(async ({ supabase, request }) => {
  const isSuperAdmin = await checkSuperAdmin(supabase);
  if (!isSuperAdmin) {
    return apiError("FORBIDDEN", "Super admin access required", 403);
  }

  const body = (await request.json()) as {
    seller_id: string;
    organization_id: string;
  };

  if (!body.seller_id || !body.organization_id) {
    return apiError(
      "VALIDATION_ERROR",
      "seller_id and organization_id are required",
      400,
    );
  }

  const assignment = await assignSellerToOrg(
    supabase,
    body.seller_id,
    body.organization_id,
  );
  return ok(assignment);
});
