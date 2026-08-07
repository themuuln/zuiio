/**
 * GET /admin/api/academy/registrations — list registration intents with program name
 * POST /admin/api/academy/registrations — approve or decline a registration intent
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/supabase/admin-route";

export async function GET() {
  return withAuth(async (supabase) => {
    const { data, error } = await supabase
      .from("academy_registration_intents")
      .select("*, academy_programs(name)")
      .order("created_at", { ascending: false });

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data) as never;
  });
}

export async function POST(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();

    if (body.action === "approve") {
      const { data, error } = await supabase.rpc("cmd_approve_registration", {
        p_intent_id: body.intent_id,
      });
      if (error)
        return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json(data) as never;
    }

    if (body.action === "decline") {
      const { data, error } = await supabase.rpc("cmd_decline_registration", {
        p_intent_id: body.intent_id,
      });
      if (error)
        return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json(data) as never;
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  });
}
