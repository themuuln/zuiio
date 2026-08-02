import "server-only";

import crypto from "node:crypto";

import { capture } from "@zuiio/capture";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { encryptSecret } from "@/lib/crypto";
import { createServiceClient } from "@/lib/supabase";
import { verifyCompactToken } from "@/lib/tokens";

/**
 * POST /api/whatsapp/connect
 *
 * Registers an org's WhatsApp business account with the gateway (Mode B).
 * Body: { token, phoneNumberId, accessToken, phoneNumber? }
 *
 * orgId/productType come from the HMAC-verified compact link token (same
 * flow as /api/facebook/start), minted server-side by Zer/Tolom.
 *
 * Creates a custom_bots row (bot key = generated UUID) and a
 * channel_connections row (channel='whatsapp', bot_key, encrypted token).
 * Returns the webhook URL + verify token the org configures in their
 * WhatsApp Business Platform provider.
 */
export async function POST(request: NextRequest) {
	const body = (await request.json().catch(() => ({}))) as {
		token?: string;
		phoneNumberId?: string;
		accessToken?: string;
		phoneNumber?: string;
	};

	if (!body.token || !body.phoneNumberId || !body.accessToken) {
		return NextResponse.json(
			{ error: "token, phoneNumberId, and accessToken are required" },
			{ status: 400 },
		);
	}

	const decoded = verifyCompactToken(body.token);
	if (!decoded) {
		return NextResponse.json(
			{ error: "Invalid or expired link token" },
			{ status: 401 },
		);
	}

	const botKey = crypto.randomUUID();
	const sb = createServiceClient();
	const now = new Date().toISOString();

	try {
		// Custom bot mapping (what the webhook ?botKey resolves)
		const { error: botError } = await sb.from("custom_bots").upsert(
			{
				id: botKey,
				organization_id: decoded.orgId,
				product_type: decoded.productType,
				bot_username: `whatsapp_${body.phoneNumberId}`,
				is_active: true,
				created_at: now,
				updated_at: now,
			},
			{ onConflict: "id" },
		);
		if (botError) throw botError;

		// Channel connection with the at-rest-encrypted token
		const { error: connError } = await sb.from("channel_connections").upsert(
			{
				organization_id: decoded.orgId,
				channel: "whatsapp",
				channel_user_id: body.phoneNumberId,
				channel_chat_id: body.phoneNumberId,
				product_type: decoded.productType,
				bot_key: botKey,
				page_name: body.phoneNumber ?? `WhatsApp ${body.phoneNumberId}`,
				page_access_token: encryptSecret(body.accessToken),
				token_encrypted: true,
				is_active: true,
				created_at: now,
				updated_at: now,
			},
			{
				onConflict: "organization_id,channel,channel_chat_id,channel_user_id",
			},
		);
		if (connError) throw connError;

		const gatewayUrl = process.env.AGENT_GATEWAY_URL ?? "";
		const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN ?? "";

		return NextResponse.json({
			success: true,
			botKey,
			webhookUrl: `${gatewayUrl}/api/whatsapp/webhook?botKey=${botKey}`,
			verifyToken,
		});
	} catch (err) {
		capture(err, { context: "agent-gateway: whatsapp connect" });
		return NextResponse.json(
			{ error: "WhatsApp холболт бүртгэхэд алдаа гарлаа" },
			{ status: 500 },
		);
	}
}
