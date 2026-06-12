import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  checkAdminRole,
  createCampaign,
  listCampaigns,
} from "@/lib/services/admin-service";

export const GET = createRouteHandler(async ({ supabase }) => {
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

  const campaigns = await listCampaigns(supabase);
  return NextResponse.json({ data: campaigns });
});

export const POST = createRouteHandler(async ({ supabase, request }) => {
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
    name: string;
    type: string;
    organization_id?: string;
  };

  if (!body.name || !body.type) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "name and type are required",
        },
      },
      { status: 400 },
    );
  }

  // Get current admin user ID
  const { data: adminUser } = await supabase
    .from("super_admins")
    .select("id")
    .maybeSingle();

  const campaign = await createCampaign(supabase, {
    name: body.name,
    type: body.type,
    organization_id: body.organization_id,
    created_by: adminUser?.id,
  });

  return NextResponse.json({ data: campaign });
});
