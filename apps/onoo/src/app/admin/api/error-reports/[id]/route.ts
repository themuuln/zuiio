import { type NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/supabase/admin-route";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  return withAuth<{ ok: boolean }>(async (supabase) => {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (!body?.status || !["resolved", "dismissed"].includes(body.status)) {
      return NextResponse.json(
        { error: "status 'resolved' эсвэл 'dismissed' байх ёстой" },
        { status: 400 },
      ) as unknown as NextResponse<{ ok: boolean }>;
    }

    const { error } = await supabase
      .from("public_error_reports")
      .update({ status: body.status })
      .eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  });
}
