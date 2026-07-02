import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";

export const GET = createRouteHandler(async ({ orgId, supabase }) => {
  const { data, error } = await supabase
    .from("feature_flags")
    .select("id, flag_key, enabled, description, created_at, updated_at")
    .eq("organization_id", orgId);

  if (error) {
    return NextResponse.json(
      { error: { code: "FETCH_ERROR", message: error.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: data ?? [] });
});

export const PATCH = createRouteHandler(
  async ({ orgId, supabase, request }) => {
    const body = (await request.json()) as {
      flag_key: string;
      enabled: boolean;
    };

    if (!body.flag_key) {
      return NextResponse.json(
        {
          error: { code: "VALIDATION_ERROR", message: "flag_key is required" },
        },
        { status: 400 },
      );
    }

    // Upsert: insert if not exists, update if exists
    const { data: existing } = await supabase
      .from("feature_flags")
      .select("id")
      .eq("organization_id", orgId)
      .eq("flag_key", body.flag_key)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("feature_flags")
        .update({ enabled: body.enabled, updated_at: new Date().toISOString() })
        .eq("id", existing.id);

      if (error) {
        return NextResponse.json(
          { error: { code: "UPDATE_ERROR", message: error.message } },
          { status: 500 },
        );
      }
    } else {
      const { error } = await supabase.from("feature_flags").insert({
        organization_id: orgId,
        flag_key: body.flag_key,
        enabled: body.enabled,
      });

      if (error) {
        return NextResponse.json(
          { error: { code: "INSERT_ERROR", message: error.message } },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ success: true });
  },
  { minimumRole: "Org Owner" },
);
