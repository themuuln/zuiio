import { type NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/supabase/admin-route";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const AWARD_SELECT =
  "*, players!awards_player_id_fkey(canonical_name, photo_url, short_code), profiles!awards_granted_by_fkey(display_name)";

export async function GET() {
  return withAuth(async () => {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("awards")
      .select(AWARD_SELECT)
      .order("granted_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(data);
  });
}
export async function POST(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body: {
      competition_id: string;
      award_type: string;
      player_id: string;
      period_start?: string | null;
      period_end?: string | null;
      note?: string | null;
    } = await request.json();

    if (!body.competition_id || !body.award_type || !body.player_id) {
      return NextResponse.json(
        { error: "competition_id, award_type, and player_id are required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase.rpc("cmd_grant_award", {
      p_competition_id: body.competition_id,
      p_award_type: body.award_type,
      p_player_id: body.player_id,
      p_period_start: body.period_start ?? null,
      p_period_end: body.period_end ?? null,
      p_note: body.note ?? null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(data);
  });
}
