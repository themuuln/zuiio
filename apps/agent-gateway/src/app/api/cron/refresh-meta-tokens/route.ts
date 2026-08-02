import "server-only";

import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { createServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FB_APP_ID = process.env.FB_APP_ID || "";
const FB_APP_SECRET = process.env.FB_APP_SECRET || "";
const FB_GRAPH_API_VERSION = process.env.FB_GRAPH_API_VERSION || "v25.0";

interface ExpiringConnection {
	id: string;
	page_access_token: string | null;
}

/**
 * GET /api/cron/refresh-meta-tokens
 * Best-effort refresh of expiring Messenger/Instagram page access tokens.
 *
 * Meta does not allow exchanging page tokens directly — the fb_exchange_token
 * grant only works with user tokens. We still attempt it with the stored token;
 * failures are captured and never crash the cron. On success the new token is
 * re-encrypted (encryptSecret) and token_encrypted is set to true.
 */
export async function GET(request: Request): Promise<NextResponse> {
	const authHeader = request.headers.get("authorization");
	const cronSecret = process.env.CRON_SECRET;
	if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	if (!FB_APP_ID || !FB_APP_SECRET) {
		capture(
			new Error("FB_APP_ID/FB_APP_SECRET not configured — skipping refresh"),
			{ context: "agent-gateway: cron refresh-meta-tokens" },
		);
		return NextResponse.json({
			status: "skipped",
			reason: "facebook app not configured",
		});
	}

	const sb = createServiceClient();
	let refreshed = 0;
	let failed = 0;

	try {
		const cutoff = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

		const { data: connections, error } = await sb
			.from("channel_connections")
			.select("id, page_access_token")
			.in("channel", ["messenger", "instagram"])
			.eq("is_active", true)
			.lt("token_expires_at", cutoff)
			.not("page_access_token", "is", null);

		if (error) {
			capture(error, {
				context: "agent-gateway: cron refresh-meta-tokens query",
			});
			return NextResponse.json(
				{ status: "error", error: "Failed to query connections" },
				{ status: 500 },
			);
		}

		const rows = (connections ?? []) as ExpiringConnection[];

		for (const conn of rows) {
			try {
				const pageToken = decryptSecret(conn.page_access_token ?? "");
				if (!pageToken) {
					failed++;
					continue;
				}

				const tokenUrl = new URL(
					`https://graph.facebook.com/${FB_GRAPH_API_VERSION}/oauth/access_token`,
				);
				tokenUrl.searchParams.set("grant_type", "fb_exchange_token");
				tokenUrl.searchParams.set("client_id", FB_APP_ID);
				tokenUrl.searchParams.set("client_secret", FB_APP_SECRET);
				tokenUrl.searchParams.set("fb_exchange_token", pageToken);

				const tokenResponse = await fetch(tokenUrl);
				const tokenData = (await tokenResponse.json()) as {
					access_token?: string;
					expires_in?: number;
					error?: { message?: string };
				};

				if (!tokenResponse.ok || !tokenData.access_token) {
					failed++;
					capture(
						new Error(tokenData.error?.message ?? "Meta token exchange failed"),
						{ context: "agent-gateway: cron refresh-meta-tokens exchange" },
					);
					continue;
				}

				const expiresIn = tokenData.expires_in ?? 60 * 24 * 60 * 60;
				await sb
					.from("channel_connections")
					.update({
						page_access_token: encryptSecret(tokenData.access_token),
						token_encrypted: true,
						token_expires_at: new Date(
							Date.now() + expiresIn * 1000,
						).toISOString(),
						updated_at: new Date().toISOString(),
					})
					.eq("id", conn.id);

				refreshed++;
			} catch (err) {
				failed++;
				capture(err, {
					context: "agent-gateway: cron refresh-meta-tokens row",
				});
			}
		}

		return NextResponse.json({
			status: "ok",
			processed: rows.length,
			refreshed,
			failed,
		});
	} catch (err) {
		capture(err, { context: "agent-gateway: cron refresh-meta-tokens" });
		return NextResponse.json(
			{ status: "error", error: "Failed to refresh Meta tokens" },
			{ status: 500 },
		);
	}
}
