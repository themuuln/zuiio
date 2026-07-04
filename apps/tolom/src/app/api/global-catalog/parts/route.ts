import { NextResponse } from "next/server";
import { createSimpleRouteHandler } from "@/lib/api-handler";
import { reportServerError } from "@/lib/sentry-report-server";
import { ok } from "@/lib/api-response";

export const GET = createSimpleRouteHandler(async ({ user, supabase }) => {
  console.log("[Global Catalog API] Querying as user:", user?.email);

  const { data, error } = await supabase
    .from("global_parts_catalog")
    .select(
      "id, name, name_mn, category, description, part_number, unit, is_active",
    )
    .eq("is_active", true)
    .order("category")
    .order("name");

  if (error) {
    reportServerError("[Global Catalog API] Query error:", error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500 },
    );
  }

  return ok(data);
});
