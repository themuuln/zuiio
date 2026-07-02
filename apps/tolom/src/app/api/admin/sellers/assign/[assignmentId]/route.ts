import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  checkSuperAdmin,
  removeSellerAssignment,
} from "@/lib/services/admin-service";

export const DELETE = createRouteHandler(async ({ supabase, params }) => {
  const isSuperAdmin = await checkSuperAdmin(supabase);
  if (!isSuperAdmin) {
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

  await removeSellerAssignment(supabase, params.assignmentId);
  return NextResponse.json({ data: { success: true } });
});
