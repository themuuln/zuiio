import { createSimpleRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";
import { getAdminUser } from "@/lib/services/admin-service";

export const GET = createSimpleRouteHandler(async ({ supabase }) => {
  const user = await getAdminUser(supabase);
  return ok({
    isAdmin: !!user,
    isSuperAdmin: user?.role === "super_admin",
    role: user?.role ?? null,
  });
});
