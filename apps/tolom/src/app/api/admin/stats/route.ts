import { createRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";
import { checkAdminRole, getPlatformStats } from "@/lib/services/admin-service";

export const GET = createRouteHandler(async ({ supabase }) => {
  const hasAccess = await checkAdminRole(supabase, "super_admin");
  if (!hasAccess) {
    return apiError("FORBIDDEN", "Super admin access required", 403);
  }

  const stats = await getPlatformStats(supabase);
  return ok(stats);
});
