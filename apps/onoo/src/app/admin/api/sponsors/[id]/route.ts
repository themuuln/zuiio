import { type NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/supabase/admin-route";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAuth(async () => {
    const { id } = await params;
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
      p_id: id,
      p_active: body.active ?? true,
    });

    if (error) throw error;
    return NextResponse.json(data);
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAuth(async () => {
    const { id } = await params;
    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from("sponsors")
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  });
}
