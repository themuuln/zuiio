import "server-only";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { resumeBotAfterHandoff } from "@/state/handoff";

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const body = (await request.json().catch(() => ({}))) as { orgId?: string };
	if (!id || !body.orgId)
		return NextResponse.json(
			{ error: "handoff id and orgId are required" },
			{ status: 400 },
		);
	const sb = createServiceClient();
	const { data, error } = await sb
		.from("agent_handoff_events")
		.update({
			status: "human_resolved",
			resolved_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		})
		.eq("id", id)
		.eq("organization_id", body.orgId)
		.in("status", ["human_active", "pending_human"])
		.select("chat_id")
		.maybeSingle();
	if (error || !data)
		return NextResponse.json(
			{ error: "Шилжүүлэлтийг буцаах боломжгүй байна" },
			{ status: 409 },
		);
	await resumeBotAfterHandoff(sb, body.orgId, Number(data.chat_id));
	return NextResponse.json({ ok: true });
}
