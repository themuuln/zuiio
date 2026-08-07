import { type NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/supabase/admin-route";

/**
 * GET /admin/api/org/identity-disputes?status=open
 * Lists identity disputes with joined player and competition names.
 */
export async function GET(request: NextRequest) {
  return withAuth(async (supabase) => {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("identity_disputes")
      .select("*, players(canonical_name, photo_url), competitions(name)")
      .order("submitted_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      ) as never;
    }
    return NextResponse.json(data) as never;
  });
}

/**
 * POST /admin/api/org/identity-disputes
 * Body (create): { player_id, competition_id?, dispute_reason, description, evidence_notes? }
 * Body (resolve): { id, status, resolution_notes? }
 */
export async function POST(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();

    // ── Resolve an existing dispute ──
    if (body.id && body.status) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      const { data, error } = await supabase
        .from("identity_disputes")
        .update({
          status: body.status,
          resolution_notes: body.resolution_notes || null,
          resolved_by: userId,
          resolved_at:
            body.status === "resolved" || body.status === "dismissed"
              ? new Date().toISOString()
              : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", body.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 },
        ) as never;
      }
      return NextResponse.json(data) as never;
    }

    // ── Create a new dispute ──
    const {
      player_id,
      competition_id,
      dispute_reason,
      description,
      evidence_notes,
    } = body;

    if (!player_id || !dispute_reason || !description) {
      return NextResponse.json(
        { error: "player_id, dispute_reason, and description are required" },
        { status: 400 },
      ) as never;
    }
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    const { data, error } = await supabase
      .from("identity_disputes")
      .insert({
        player_id,
        competition_id: competition_id || null,
        dispute_reason,
        description,
        evidence_notes: evidence_notes || null,
        status: "open",
        submitted_by: userId,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      ) as never;
    }
    return NextResponse.json(data) as never;
  });
}
