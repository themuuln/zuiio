import "server-only";

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

const WINDOW_MS = 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
	const body = (await request.json()) as Record<string, unknown>;
	const organizationId = (body.organizationId ??
		new URL(request.url).searchParams.get("orgId")) as string | null;
	const channel = body.channel as string | undefined;
	const message = typeof body.message === "string" ? body.message.trim() : "";
	if (!organizationId || !channel || !message)
		return NextResponse.json(
			{ error: "organizationId, channel, and message are required" },
			{ status: 400 },
		);
	if (!["messenger", "instagram", "telegram", "whatsapp"].includes(channel))
		return NextResponse.json({ error: "Unsupported channel" }, { status: 400 });
	const sb = createServiceClient();
	const now = new Date();
	const audience = (body.audience ?? {}) as { userIds?: string[] };
	let consentQuery = sb
		.from("user_consents")
		.select("channel_user_id,page_id")
		.eq("organization_id", organizationId)
		.eq("channel", channel)
		.eq("consent_type", "broadcast")
		.is("revoked_at", null)
		.or(`expires_at.is.null,expires_at.gt.${now.toISOString()}`);
	if (audience.userIds?.length)
		consentQuery = consentQuery.in("channel_user_id", audience.userIds);
	const { data: consents, error: consentError } = await consentQuery;
	if (consentError)
		return NextResponse.json(
			{ error: "Unable to evaluate consent" },
			{ status: 500 },
		);
	const allowed: Array<{ userId: string; pageId: string | null }> = [];
	for (const recipient of consents ?? []) {
		const { data: session } = await sb
			.from("agent_sessions")
			.select("updated_at")
			.eq("organization_id", organizationId)
			.eq("channel", channel)
			.eq("channel_user_id", recipient.channel_user_id)
			.order("updated_at", { ascending: false })
			.limit(1)
			.maybeSingle();
		if (
			session?.updated_at &&
			now.getTime() - new Date(session.updated_at).getTime() < WINDOW_MS
		)
			allowed.push({
				userId: recipient.channel_user_id,
				pageId: recipient.page_id,
			});
	}
	const { data: broadcast, error } = await sb
		.from("broadcasts")
		.insert({
			organization_id: organizationId,
			channel,
			message,
			audience: { ...audience, eligible: allowed.length },
			scheduled_at: body.scheduledAt ?? now.toISOString(),
		})
		.select()
		.single();
	if (error || !broadcast)
		return NextResponse.json(
			{ error: "Unable to schedule broadcast" },
			{ status: 500 },
		);
	if (allowed.length) {
		const jobs = allowed.map((recipient) => ({
			organization_id: organizationId,
			channel,
			payload: {
				kind: "broadcast",
				broadcastId: broadcast.id,
				channel,
				channelUserId: recipient.userId,
				pageId: recipient.pageId,
				message,
				messaging_type: "RESPONSE",
			},
			status: "pending",
		}));
		const { error: jobsError } = await sb.from("agent_async_jobs").insert(jobs);
		if (jobsError)
			return NextResponse.json(
				{ error: "Unable to queue broadcast" },
				{ status: 500 },
			);
	}
	return NextResponse.json(
		{
			broadcast,
			queued: allowed.length,
			suppressed: (consents ?? []).length - allowed.length,
		},
		{ status: 202 },
	);
}
