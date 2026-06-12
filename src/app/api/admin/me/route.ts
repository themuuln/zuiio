import { NextResponse } from "next/server";
import { createSimpleRouteHandler } from "@/lib/api-handler";
import { getAdminUser } from "@/lib/services/admin-service";

export const GET = createSimpleRouteHandler(async ({ supabase }) => {
  const user = await getAdminUser(supabase);
  return NextResponse.json({
    data: {
      isAdmin: !!user,
      isSuperAdmin: user?.role === "super_admin",
      role: user?.role ?? null,
    },
  });
});
