import "server-only";

import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";

import { FacebookChannel } from "@/channels/facebook";
import { isGatewayApiKeyValid } from "@/lib/api-auth";
import { decryptSecret } from "@/lib/crypto";
import { createServiceClient } from "@/lib/supabase";

type PersistentMenuItem =
	| { type: "postback"; title: string; payload: string }
	| { type: "web_url"; title: string; url: string }
	| {
			type: "nested";
			title: string;
			call_to_actions: Array<
				| { type: "postback"; title: string; payload: string }
				| { type: "web_url"; title: string; url: string }
			>;
	  };

async function resolveChannel(
	orgId: string,
	pageId: string,
): Promise<FacebookChannel | null> {
	const sb = createServiceClient();
	const { data, error } = await sb
		.from("channel_connections")
		.select("page_access_token, token_encrypted")
		.eq("organization_id", orgId)
		.eq("page_id", pageId)
		.eq("channel", "messenger")
		.eq("is_active", true)
		.limit(1)
		.maybeSingle();

	if (error || !data?.page_access_token) return null;

	const token = data.token_encrypted
		? decryptSecret(data.page_access_token)
		: data.page_access_token;

	return new FacebookChannel({ pageId, pageAccessToken: token });
}

/**
 * GET /api/facebook/profile?orgId=&pageId=
 * Returns the current Messenger Profile (persistent_menu, get_started, greeting, ice_breakers).
 */
export async function GET(request: Request): Promise<NextResponse> {
	if (!isGatewayApiKeyValid(request)) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
	const url = new URL(request.url);
	const orgId = url.searchParams.get("orgId")?.trim() ?? "";
	const pageId = url.searchParams.get("pageId")?.trim() ?? "";
	if (!orgId || !pageId) {
		return NextResponse.json(
			{ error: "orgId and pageId are required" },
			{ status: 400 },
		);
	}

	const channel = await resolveChannel(orgId, pageId);
	if (!channel) {
		return NextResponse.json(
			{ error: "Page connection not found" },
			{ status: 404 },
		);
	}

	const profile = await channel.getMessengerProfile();
	if (!profile) {
		return NextResponse.json(
			{ error: "Failed to fetch messenger profile" },
			{ status: 502 },
		);
	}
	return NextResponse.json({ profile });
}

/**
 * POST /api/facebook/profile
 * Body: {
 *   orgId, pageId,
 *   persistentMenu?: PersistentMenuItem[], composerInputDisabled?: boolean,
 *   getStarted?: string, greeting?: string,
 *   iceBreakers?: { question: string, payload: string }[]
 * }
 * Any combination may be sent — each maps to the corresponding messenger_profile field.
 */
export async function POST(request: Request): Promise<NextResponse> {
	if (!isGatewayApiKeyValid(request)) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	let body: Record<string, unknown>;
	try {
		body = (await request.json()) as Record<string, unknown>;
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	const orgId = typeof body.orgId === "string" ? body.orgId.trim() : "";
	const pageId = typeof body.pageId === "string" ? body.pageId.trim() : "";
	if (!orgId || !pageId) {
		return NextResponse.json(
			{ error: "orgId and pageId are required" },
			{ status: 400 },
		);
	}

	const channel = await resolveChannel(orgId, pageId);
	if (!channel) {
		return NextResponse.json(
			{ error: "Page connection not found" },
			{ status: 404 },
		);
	}

	try {
		// Persistent menu — right-corner ☰ menu
		if (Array.isArray(body.persistentMenu)) {
			const ok = await channel.setPersistentMenu(
				body.persistentMenu as PersistentMenuItem[],
				{
					composerInputDisabled:
						typeof body.composerInputDisabled === "boolean"
							? body.composerInputDisabled
							: false,
				},
			);
			if (!ok) throw new Error("setPersistentMenu failed");
		}

		if (typeof body.getStarted === "string") {
			const ok = await channel.setGetStarted(body.getStarted);
			if (!ok) throw new Error("setGetStarted failed");
		}

		if (typeof body.greeting === "string") {
			const ok = await channel.setGreeting(body.greeting);
			if (!ok) throw new Error("setGreeting failed");
		}

		if (Array.isArray(body.iceBreakers)) {
			const ok = await channel.setIceBreakers(
				body.iceBreakers as Array<{ question: string; payload: string }>,
			);
			if (!ok) throw new Error("setIceBreakers failed");
		}

		// Allow raw passthrough for power users
		if (
			body.messengerProfile &&
			typeof body.messengerProfile === "object" &&
			!Array.isArray(body.messengerProfile)
		) {
			const ok = await channel.setMessengerProfile(
				body.messengerProfile as Record<string, unknown>,
			);
			if (!ok) throw new Error("setMessengerProfile failed");
		}

		return NextResponse.json({ success: true });
	} catch (err) {
		capture(err, { context: "facebook: profile POST" });
		return NextResponse.json(
			{
				error: err instanceof Error ? err.message : "Failed to update profile",
			},
			{ status: 500 },
		);
	}
}

/**
 * DELETE /api/facebook/profile?orgId=&pageId=&fields=persistent_menu,get_started
 * Deletes the listed messenger_profile fields.
 */
export async function DELETE(request: Request): Promise<NextResponse> {
	if (!isGatewayApiKeyValid(request)) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}
	const url = new URL(request.url);
	const orgId = url.searchParams.get("orgId")?.trim() ?? "";
	const pageId = url.searchParams.get("pageId")?.trim() ?? "";
	const fieldsParam = url.searchParams.get("fields")?.trim() ?? "";
	if (!orgId || !pageId || !fieldsParam) {
		return NextResponse.json(
			{ error: "orgId, pageId and fields are required" },
			{ status: 400 },
		);
	}
	const fields = fieldsParam
		.split(",")
		.map((f) => f.trim())
		.filter(Boolean);

	const allowed: Record<string, true> = {
		persistent_menu: true,
		get_started: true,
		greeting: true,
		ice_breakers: true,
		account_linking_url: true,
		home_url: true,
		whitelisted_domains: true,
	};
	for (const f of fields) {
		if (!allowed[f]) {
			return NextResponse.json(
				{ error: `Invalid field: ${f}` },
				{ status: 400 },
			);
		}
	}

	const channel = await resolveChannel(orgId, pageId);
	if (!channel) {
		return NextResponse.json(
			{ error: "Page connection not found" },
			{ status: 404 },
		);
	}

	const ok = await channel.deleteMessengerProfile(fields);
	if (!ok) {
		return NextResponse.json(
			{ error: "Failed to delete profile fields" },
			{ status: 502 },
		);
	}
	return NextResponse.json({ success: true });
}
