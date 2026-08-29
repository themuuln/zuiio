import "server-only";

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET(request: Request) {
	const url = new URL(request.url);
	const orgId = url.searchParams.get("orgId");
	const limit = Math.min(
		Math.max(Number(url.searchParams.get("limit") ?? 50), 1),
		100,
	);
	const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);
	if (!orgId)
		return NextResponse.json({ error: "orgId is required" }, { status: 400 });
	const sb = createServiceClient();
	const { data, error, count } = await sb
		.from("agent_sessions")
		.select(
			"id, organization_id, channel, channel_chat_id, channel_user_id, messages, updated_at",
			{ count: "exact" },
		)
		.eq("organization_id", orgId)
		.order("updated_at", { ascending: false })
		.range(offset, offset + limit - 1);
	if (error)
		return NextResponse.json(
			{ error: "Inbox мэдээлэл авахад алдаа гарлаа" },
			{ status: 500 },
		);
	const { data: handoffs } = await sb
		.from("agent_handoff_events")
		.select("id, chat_id, user_id, status, admin_user_id, reason, created_at")
		.eq("organization_id", orgId)
		.in("status", ["pending_human", "human_active"]);
	const byChat = new Map((handoffs ?? []).map((h) => [String(h.chat_id), h]));
	const conversations = (data ?? []).map((row) => {
		const messages = Array.isArray(row.messages) ? row.messages : [];
		const last = messages.at(-1) as
			| { role?: string; content?: string }
			| undefined;
		const handoff = byChat.get(String(row.channel_chat_id));
		return {
			...row,
			messages: undefined,
			last_message: last?.content ?? null,
			last_user_message_at: last?.role === "user" ? row.updated_at : null,
			unread: last?.role === "user",
			assigned: handoff?.admin_user_id ?? null,
			takeover: handoff?.status === "human_active",
			handoff,
		};
	});
	return NextResponse.json({
		conversations,
		total: count ?? conversations.length,
		limit,
		offset,
	});
}
