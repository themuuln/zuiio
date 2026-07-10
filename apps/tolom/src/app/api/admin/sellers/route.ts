import { createRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";
import {

  checkAdminRole,
  listOrganizations,
  listSellerAssignments,
} from "@/lib/services/admin-service";

export { dynamic } from "@/lib/api-handler";

export const GET = createRouteHandler(async ({ supabase }) => {
  const hasAccess = await checkAdminRole(supabase, "seller");
  if (!hasAccess) {
    return apiError("FORBIDDEN", "Seller access required", 403);
  }

  // Get current admin user
  const { data: adminUser } = await supabase
    .from("super_admins")
    .select("id, user_id, role")
    .maybeSingle();

  if (!adminUser) {
    return apiError("NOT_FOUND", "Admin user not found", 404);
  }

  // Super admins see all orgs, sellers see only assigned orgs
  if (adminUser.role === "super_admin") {
    const orgs = await listOrganizations(supabase);
    return ok({ organizations: orgs, assignments: [] });
  }

  const assignments = await listSellerAssignments(supabase, adminUser.id);
  return ok({
    organizations: assignments.map((a) => ({
      id: a.organization_id,
      name: a.organization_name,
      slug: a.organization_slug,
    })),
    assignments,
  });
});
