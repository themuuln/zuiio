import { NextResponse } from "next/server";
import { createSimpleRouteHandler } from "@/lib/api-handler";
import { ok } from "@/lib/api-response";

export const GET = createSimpleRouteHandler(async ({ supabase }) => {
  const { data, error } = await supabase
    .from("global_services_catalog")
    .select(
      "id, name, name_mn, category, description, estimated_duration_minutes, interval_months, interval_km, is_active",
    )
    .eq("is_active", true)
    .order("category")
    .order("name");

  if (error) {
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500 },
    );
  }
  return ok(data);
});
