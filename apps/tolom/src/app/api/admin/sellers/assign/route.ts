import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  assignSellerToOrg,
  checkSuperAdmin,
} from "@/lib/services/admin-service";

export const POST = createRouteHandler(async ({ supabase, request }) => {
  const isSuperAdmin = await checkSuperAdmin(supabase);
  if (!isSuperAdmin) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Super admin access required" } },
      { status: 403 },
    );
  }

  const body = (await request.json()) as {
    seller_id: string;
    organization_id: string;
  };

  if (!body.seller_id || !body.organization_id) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "seller_id and organization_id are required",
        },
      },
      { status: 400 },
    );
  }

  const assignment = await assignSellerToOrg(
    supabase,
    body.seller_id,
    body.organization_id,
  );
  return NextResponse.json({ data: assignment });
});
