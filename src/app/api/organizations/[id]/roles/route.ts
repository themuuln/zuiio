import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";

export const GET = createRouteHandler(async ({ orgId, supabase }) => {
  const { data: roles, error } = await supabase
    .from("roles")
    .select("id, name, description, is_system")
    .eq("organization_id", orgId)
    .is("deleted_at", null);

  if (error) {
    return NextResponse.json(
      { error: { code: "FETCH_ERROR", message: error.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: roles ?? [] });
});
