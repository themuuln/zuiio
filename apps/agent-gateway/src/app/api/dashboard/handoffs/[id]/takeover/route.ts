import "server-only";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const body = (await request.json().catch(() => ({}))) as {
		orgId?: string;
		userId?: number;
	};
	if (!id || !body.orgId)
		return NextResponse.json(
			{ error: "handoff id and orgId are required" },
			{ status: 400 },
		);
	const sb = createServiceClient();
	const { data, error } = await sb
		.from("agent_handoff_events")
		.update({
			status: "human_active",
			admin_user_id: body.userId ?? null,
			updated_at: new Date().toISOString(),
		})
		.eq("id", id)
		.eq("organization_id", body.orgId)
		.eq("status", "pending_human")
		.select("id")
		.maybeSingle();
	if (error || !data)
		return NextResponse.json(
			{ error: "Шилжүүлэлтийг авах боломжгүй байна" },
			{ status: 409 },
		);
	return NextResponse.json({ ok: true });
}
