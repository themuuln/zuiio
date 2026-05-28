import { NextResponse } from "next/server";
import { createSimpleRouteHandler } from "@/lib/api-handler";

export const GET = createSimpleRouteHandler(async ({ supabase }) => {
  const { data, error } = await supabase
    .from("global_services_catalog")
    .select("id, name, category, description, estimated_duration_minutes")
    .eq("is_active", true)
    .order("category")
    .order("name");

  if (error) {
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data });
});
