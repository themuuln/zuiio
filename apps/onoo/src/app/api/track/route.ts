import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Accepts page-view beacon POSTs from the ViewBeacon client component.
 * Uses the service-role key to invoke the SECURITY DEFINER RPC, bypassing RLS.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entityType, entityId } = body as {
      entityType?: string;
      entityId?: string;
    };

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "entityType and entityId are required" },
        { status: 400 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { error } = await supabase.rpc("cmd_increment_page_view", {
      p_entity_type: entityType,
      p_entity_id: entityId,
    });

    if (error) {
      // Log but don't surface details to client
      console.error("cmd_increment_page_view error:", error.message);
      return NextResponse.json(
        { error: "Failed to record view" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
