import "server-only";

import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { loadAgentProfile } from "@/state/agent-profile";

const ALLOWED_TONES = ["professional", "friendly", "formal", "casual"] as const;

/**
 * GET /api/dashboard/profile?orgId=<id>
 * Returns the internal-audience agent context profile for an org (or null).
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
	const profile = await loadAgentProfile(sb, orgId, "internal");

	return NextResponse.json({ profile });
}

/**
 * PUT /api/dashboard/profile
 * Body: { orgId, assistantName?, businessSummary?, tone?, responseLanguage?,
 *         contactDetails?, responseRules?, handoffMessage? }
 * Upserts the internal-audience profile on (organization_id, audience).
 * Empty strings are stored as null (field cleared).
 */
export async function PUT(request: Request) {
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
	if (!orgId) {
		return NextResponse.json(
			{ error: "orgId parameter is required" },
			{ status: 400 },
		);
	}

	const tone = typeof body.tone === "string" ? body.tone.trim() : "";
	if (
		tone !== "" &&
		!ALLOWED_TONES.includes(tone as (typeof ALLOWED_TONES)[number])
	) {
		return NextResponse.json(
			{ error: `tone must be one of: ${ALLOWED_TONES.join(", ")}` },
			{ status: 400 },
		);
	}

	const str = (v: unknown): string | null =>
		typeof v === "string" && v.trim() !== "" ? v.trim() : null;

	const sb = createServiceClient();
	const { error } = await sb.from("agent_context_profiles").upsert(
		{
			organization_id: orgId,
			audience: "internal",
			assistant_name: str(body.assistantName),
			business_summary: str(body.businessSummary),
			tone: tone !== "" ? tone : null,
			response_language: str(body.responseLanguage) ?? "mn",
			contact_details: str(body.contactDetails),
			response_rules: str(body.responseRules),
			handoff_message: str(body.handoffMessage),
			is_active: true,
			updated_at: new Date().toISOString(),
		},
		{ onConflict: "organization_id,audience" },
	);

	if (error) {
		capture(error, {
			context: "agent-gateway: dashboard profile save",
			orgId,
		});
		return NextResponse.json(
			{ error: "Профайл хадгалахад алдаа гарлаа" },
			{ status: 500 },
		);
	}

	return NextResponse.json({ ok: true });
}
