import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  checkAdminRole,
  listOrganizations,
  listSellerAssignments,
} from "@/lib/services/admin-service";

export const GET = createRouteHandler(async ({ supabase }) => {
  const hasAccess = await checkAdminRole(supabase, "seller");
  if (!hasAccess) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Seller access required" } },
      { status: 403 },
    );
  }

  // Get current admin user
  const { data: adminUser } = await supabase
    .from("super_admins")
    .select("id, user_id, role")
    .maybeSingle();

  if (!adminUser) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Admin user not found" } },
      { status: 404 },
    );
  }

  // Super admins see all orgs, sellers see only assigned orgs
  if (adminUser.role === "super_admin") {
    const orgs = await listOrganizations(supabase);
    return NextResponse.json({
      data: { organizations: orgs, assignments: [] },
    });
  }

  const assignments = await listSellerAssignments(supabase, adminUser.id);
  return NextResponse.json({
    data: {
      organizations: assignments.map((a) => ({
        id: a.organization_id,
        name: a.organization_name,
        slug: a.organization_slug,
      })),
      assignments,
    },
  });
});
