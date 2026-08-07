import { type NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/supabase/admin-route";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function POST(request: NextRequest) {
  return withAuth(async () => {
    const body: {
      sponsor_id: string;
      competition_id: string;
      slot: string;
      starts_on: string;
      ends_on: string;
    } = await request.json();

    if (
      !body.sponsor_id ||
      !body.competition_id ||
      !body.slot ||
      !body.starts_on ||
      !body.ends_on
    ) {
      throw new Error("Бүх талбарыг бөглөнө үү");
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.rpc("cmd_set_placement", {
      p_sponsor_id: body.sponsor_id,
      p_competition_id: body.competition_id,
      p_slot: body.slot,
      p_starts_on: body.starts_on,
      p_ends_on: body.ends_on,
    });

    if (error) throw error;
    return NextResponse.json(data);
  });
}

export async function DELETE(request: NextRequest) {
  return withAuth(async () => {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      throw new Error("ID шаардлагатай");
    }

    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from("sponsor_placements")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  });
}
