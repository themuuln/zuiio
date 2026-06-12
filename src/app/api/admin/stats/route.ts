import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { checkAdminRole, getPlatformStats } from "@/lib/services/admin-service";

export const GET = createRouteHandler(async ({ supabase }) => {
  const hasAccess = await checkAdminRole(supabase, "super_admin");
  if (!hasAccess) {
    return NextResponse.json(
      {
        error: {
          code: "FORBIDDEN",
          message: "Super admin access required",
        },
      },
      { status: 403 },
    );
  }

  const stats = await getPlatformStats(supabase);
  return NextResponse.json({ data: stats });
});
