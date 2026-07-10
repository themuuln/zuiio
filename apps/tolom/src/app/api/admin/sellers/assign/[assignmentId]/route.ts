import { createRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";
import {

  checkSuperAdmin,
  removeSellerAssignment,
} from "@/lib/services/admin-service";

export { dynamic } from "@/lib/api-handler";

export const DELETE = createRouteHandler(async ({ supabase, params }) => {
  const isSuperAdmin = await checkSuperAdmin(supabase);
  if (!isSuperAdmin) {
    return apiError("FORBIDDEN", "Super admin access required", 403);
  }

  await removeSellerAssignment(supabase, params.assignmentId);
  return ok({ success: true });
});
