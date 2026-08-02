import "server-only";

import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

/**
 * GET /api/dashboard/channels?orgId=<id>
 * Lists channel connections for an org — active first, newest first.
 * Protected by the dashboard middleware (DASHBOARD_SECRET).
 */
export async function GET(request: Request) {
	const url = new URL(request.url);
	const orgId = url.searchParams.get("orgId");
	if (!orgId) {
		return NextResponse.json(
			{ error: "orgId parameter is required" },
			{ status: 400 },
		);
	}

	const sb = createServiceClient();
	const { data, error } = await sb
		.from("channel_connections")
		.select(
			"id, channel, page_name, product_type, is_active, last_user_message_at, audience, created_at",
		)
		.eq("organization_id", orgId)
		.order("is_active", { ascending: false })
		.order("created_at", { ascending: false });

	if (error) {
		capture(error, {
			context: "agent-gateway: dashboard channels",
			orgId,
		});
		return NextResponse.json(
			{ error: "Сувгуудын жагсаалт авахад алдаа гарлаа" },
			{ status: 500 },
		);
	}

	const channels = (data ?? []).map((row) => ({
		id: row.id as string,
		channel: row.channel as string,
		pageName: (row.page_name as string | null) ?? null,
		productType: row.product_type as string,
		isActive: row.is_active as boolean,
		lastUserMessageAt: (row.last_user_message_at as string | null) ?? null,
		audience: (row.audience as string | null) ?? null,
		createdAt: row.created_at as string,
	}));

	return NextResponse.json({ channels });
}

/**
 * POST /api/dashboard/channels
 * Body: { orgId, id } — deactivates (disconnects) a channel connection.
 * Scoped by orgId so an org can never touch another org's connection.
 */
export async function POST(request: Request) {
	const body = (await request.json().catch(() => null)) as Record<
		string,
		unknown
	> | null;
	if (!body || typeof body !== "object") {
		return NextResponse.json(
			{ error: "Invalid request body" },
			{ status: 400 },
		);
	}

	const orgId = typeof body.orgId === "string" ? body.orgId.trim() : "";
	const id = typeof body.id === "string" ? body.id.trim() : "";
	if (!orgId || !id) {
		return NextResponse.json(
			{ error: "orgId and id are required" },
			{ status: 400 },
		);
	}

	const sb = createServiceClient();
	const { error } = await sb
		.from("channel_connections")
		.update({ is_active: false, updated_at: new Date().toISOString() })
		.eq("organization_id", orgId)
		.eq("id", id);

	if (error) {
		capture(error, {
			context: "agent-gateway: dashboard channel disconnect",
			orgId,
		});
		return NextResponse.json(
			{ error: "Сувгийн холболтыг устгахад алдаа гарлаа" },
			{ status: 500 },
		);
	}

	return NextResponse.json({ ok: true });
}
