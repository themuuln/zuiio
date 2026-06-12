import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  checkAdminRole,
  deleteCampaign,
  updateCampaign,
} from "@/lib/services/admin-service";

export const PATCH = createRouteHandler(
  async ({ supabase, request, params }) => {
    const hasAccess = await checkAdminRole(supabase, "marketing_manager");
    if (!hasAccess) {
      return NextResponse.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "Marketing manager access required",
          },
        },
        { status: 403 },
      );
    }

    const body = (await request.json()) as {
      name?: string;
      type?: string;
      status?: string;
    };

    const campaign = await updateCampaign(supabase, params.campaignId, body);
    return NextResponse.json({ data: campaign });
  },
);

export const DELETE = createRouteHandler(async ({ supabase, params }) => {
  const hasAccess = await checkAdminRole(supabase, "marketing_manager");
  if (!hasAccess) {
    return NextResponse.json(
      {
        error: {
          code: "FORBIDDEN",
          message: "Marketing manager access required",
        },
      },
      { status: 403 },
    );
  }

  await deleteCampaign(supabase, params.campaignId);
  return NextResponse.json({ data: { success: true } });
});
