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
	page_id: string | null;
	page_access_token: string | null;
	metadata: { user_access_token?: string } | null;
}

/**
 * GET /api/cron/refresh-meta-tokens
 * Best-effort refresh of expiring Messenger/Instagram page access tokens.
 *
 * Meta does NOT allow exchanging page tokens directly — fb_exchange_token
 * only works on USER tokens. The correct chain:
 *
 *   1. Refresh the stored user long-lived token (fb_exchange_token).
 *   2. GET /me/accounts?fields=id,access_token with the fresh user token.
 *   3. Pick the page token matching the connection's page_id.
 *
 * Connections created before the user token was stored (metadata
 * user_access_token missing) cannot be refreshed — they are counted as
 * skipped and must be reconnected. Failures are captured and never crash
 * the cron.
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
	let skipped = 0;

	try {
		const cutoff = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

		const { data: connections, error } = await sb
			.from("channel_connections")
			.select("id, page_id, page_access_token, metadata")
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
			const userTokenEncrypted = conn.metadata?.user_access_token;
			if (!userTokenEncrypted || !conn.page_id) {
				// Old rows predate user-token storage — reconnect required.
				skipped++;
				continue;
			}

			try {
				const userToken = decryptSecret(userTokenEncrypted);
				if (!userToken) {
					failed++;
					continue;
				}

				// 1. Refresh the user token (long-lived → fresh long-lived).
				let activeUserToken = userToken;
				const exchangeUrl = new URL(
					`https://graph.facebook.com/${FB_GRAPH_API_VERSION}/oauth/access_token`,
				);
				exchangeUrl.searchParams.set("grant_type", "fb_exchange_token");
				exchangeUrl.searchParams.set("client_id", FB_APP_ID);
				exchangeUrl.searchParams.set("client_secret", FB_APP_SECRET);
				exchangeUrl.searchParams.set("fb_exchange_token", userToken);

				const exchangeResponse = await fetch(exchangeUrl);
				const exchangeData = (await exchangeResponse.json()) as {
					access_token?: string;
					error?: { message?: string };
				};
				if (exchangeResponse.ok && exchangeData.access_token) {
					activeUserToken = exchangeData.access_token;
				} else {
					// User token may still be valid — fall through and try /me/accounts
					// with the stored token rather than failing the whole row.
					capture(
						new Error(
							exchangeData.error?.message ?? "user token exchange failed",
						),
						{ context: "agent-gateway: cron refresh-meta-tokens user" },
					);
				}

				// 2. Re-fetch the managed pages with the active user token.
				const accountsUrl = new URL(
					`https://graph.facebook.com/${FB_GRAPH_API_VERSION}/me/accounts`,
				);
				accountsUrl.searchParams.set("access_token", activeUserToken);
				accountsUrl.searchParams.set("fields", "id,access_token");

				const accountsResponse = await fetch(accountsUrl);
				const accountsData = (await accountsResponse.json()) as {
					data?: Array<{ id: string; access_token: string }>;
					error?: { message?: string };
				};

				if (!accountsResponse.ok || !accountsData.data) {
					failed++;
					capture(
						new Error(
							accountsData.error?.message ?? "me/accounts fetch failed",
						),
						{ context: "agent-gateway: cron refresh-meta-tokens pages" },
					);
					continue;
				}

				// 3. Pick the page token for this connection's page.
				const pageToken = accountsData.data.find(
					(p) => p.id === conn.page_id,
				)?.access_token;
				if (!pageToken) {
					failed++;
					capture(new Error(`page ${conn.page_id} no longer managed by user`), {
						context: "agent-gateway: cron refresh-meta-tokens page",
					});
					continue;
				}

				// 4. Persist the fresh page token; keep the refreshed user token.
				await sb
					.from("channel_connections")
					.update({
						page_access_token: encryptSecret(pageToken),
						token_encrypted: true,
						token_expires_at: new Date(
							Date.now() + 60 * 24 * 60 * 60 * 1000,
						).toISOString(),
						metadata: {
							...conn.metadata,
							user_access_token: encryptSecret(activeUserToken),
						},
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
			skipped,
		});
	} catch (err) {
		capture(err, { context: "agent-gateway: cron refresh-meta-tokens" });
		return NextResponse.json(
			{ status: "error", error: "Failed to refresh Meta tokens" },
			{ status: 500 },
		);
	}
}
