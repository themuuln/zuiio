import "server-only";

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

function orgId(request: Request, body?: Record<string, unknown>) {
	return (
		new URL(request.url).searchParams.get("orgId") ??
		(body?.orgId as string | undefined)
	);
}

export async function GET(request: Request) {
	const organizationId = orgId(request);
	if (!organizationId)
		return NextResponse.json(
			{ error: "orgId parameter is required" },
			{ status: 400 },
		);
	const url = new URL(request.url);
	const query = createServiceClient()
		.from("user_consents")
		.select("*")
		.eq("organization_id", organizationId)
		.order("granted_at", { ascending: false });
	if (url.searchParams.get("channel"))
		query.eq("channel", url.searchParams.get("channel") as string);
	if (url.searchParams.get("channelUserId"))
		query.eq(
			"channel_user_id",
			url.searchParams.get("channelUserId") as string,
		);
	const { data, error } = await query;
	if (error)
		return NextResponse.json(
			{ error: "Unable to load consents" },
			{ status: 500 },
		);
	return NextResponse.json({ consents: data ?? [] });
}

export async function POST(request: Request) {
	const body = (await request.json()) as Record<string, unknown>;
	const organizationId = orgId(request, body);
	if (
		!organizationId ||
		!body.channel ||
		!body.channelUserId ||
		!body.consentType ||
		!body.source
	)
		return NextResponse.json(
			{
				error:
					"organizationId, channel, channelUserId, consentType, and source are required",
			},
			{ status: 400 },
		);
	const { data, error } = await createServiceClient()
		.from("user_consents")
		.insert({
			organization_id: organizationId,
			channel: body.channel,
			channel_user_id: body.channelUserId,
			page_id: body.pageId ?? null,
			consent_type: body.consentType,
			source: body.source,
			expires_at: body.expiresAt ?? null,
		})
		.select()
		.single();
	if (error)
		return NextResponse.json(
			{ error: "Unable to save consent" },
			{ status: 500 },
		);
	return NextResponse.json({ consent: data }, { status: 201 });
}

export async function DELETE(request: Request) {
	const body = (await request.json().catch(() => ({}))) as Record<
		string,
		unknown
	>;
	const organizationId = orgId(request, body);
	const id =
		new URL(request.url).searchParams.get("id") ??
		(body.id as string | undefined);
	if (!organizationId || !id)
		return NextResponse.json(
			{ error: "orgId and id are required" },
			{ status: 400 },
		);
	const { error } = await createServiceClient()
		.from("user_consents")
		.update({ revoked_at: new Date().toISOString() })
		.eq("organization_id", organizationId)
		.eq("id", id);
	if (error)
		return NextResponse.json(
			{ error: "Unable to revoke consent" },
			{ status: 500 },
		);
	return NextResponse.json({ revoked: true });
}
