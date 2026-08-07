import { type NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/supabase/admin-route";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function GET() {
  return withAuth(async () => {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("sponsors")
      .select("*, sponsor_placements(*)")
      .order("name");
    if (error) throw error;
    return NextResponse.json(data);
  });
}

export async function POST(request: NextRequest) {
  return withAuth(async () => {
    const body: {
      name: string;
      logo_url?: string | null;
      link_url?: string | null;
      active?: boolean;
    } = await request.json();

    if (!body.name?.trim()) {
      throw new Error("Нэр заавал байх ёстой");
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.rpc("cmd_upsert_sponsor", {
      p_name: body.name.trim(),
      p_logo_url: body.logo_url ?? undefined,
      p_link_url: body.link_url ?? undefined,
      p_id: undefined,
      p_active: body.active ?? true,
    });

    if (error) throw error;
    return NextResponse.json(data);
  });
}
