import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { updateMember } from "@/lib/services/user-service";

export const PATCH = createRouteHandler(
  async ({ request, orgId, params, supabase }) => {
    const body = await request.json();
    const userId = params.userId;
    // body: { fullName?, phone?, roleId?, branchId? }
    await updateMember(supabase, userId, orgId, {
      fullName: body.fullName,
      phone: body.phone,
      roleId: body.roleId,
      branchId: body.branchId,
    });
    return NextResponse.json({ success: true });
  },
  { rateLimit: true, subscription: true },
);
