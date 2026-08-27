import { capture } from "@zuiio/capture";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { FacebookChannel } from "@/channels/facebook";
import { DEFAULT_COMMENT_REPLY_CONFIG } from "@/gateway/comment-agent";
import { encryptSecret } from "@/lib/crypto";
import { getRedis } from "@/lib/redis";
import { createServiceClient } from "@/lib/supabase";

const facebookChannel = new FacebookChannel();

/**
 * POST: Select a Facebook Page to connect.
 *
 * Body:
 * - pageId: Facebook Page ID
 * - pageName: Page display name
 * - orgId: Organization ID
 * - productType: "tolom" or "zer"
 *
 * Flow:
 * 1. Get page access token from cookie
 * 2. Store page connection in channel_connections
 * 3. Subscribe page to webhook
 * 4. Check for Instagram account
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
	try {
		const body = (await request.json()) as {
			pageId?: string;
			pageName?: string;
			orgId?: string;
			productType?: string;
			sid?: string;
		};

		const { pageId, pageName, orgId, productType, sid } = body;

		if (!pageId || !pageName || !orgId) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 },
			);
		}

		let effectiveOrgId = orgId;
		let effectiveProductType = productType || "zer";
		let pages: Array<{ id: string; name: string; access_token: string }>;
		let userToken = request.cookies.get("fb_user_token")?.value;
		const redis = getRedis();

		if (sid) {
			if (!/^[0-9a-f-]{36}$/i.test(sid) || !redis) {
				return NextResponse.json(
					{ error: "OAuth session expired. Please try again." },
					{ status: 400 },
				);
			}
			const session = await redis.get<{
				pages: Array<{ id: string; name: string; access_token: string }>;
				userToken: string;
				orgId: string;
				productType: string;
			}>(`fb:select:${sid}`);
			if (!session) {
				return NextResponse.json(
					{ error: "OAuth session expired. Please try again." },
					{ status: 400 },
				);
			}
			effectiveOrgId = session.orgId;
			effectiveProductType = session.productType || "zer";
			pages = session.pages;
			userToken = session.userToken;
		} else {
			const pagesCookie = request.cookies.get("fb_pages")?.value;
			if (!pagesCookie) {
				return NextResponse.json(
					{ error: "OAuth session expired. Please try again." },
					{ status: 400 },
				);
			}
			pages = JSON.parse(pagesCookie) as Array<{
				id: string;
				name: string;
				access_token: string;
			}>;
		}

		const selectedPage = pages.find((p) => p.id === pageId);
		if (!selectedPage) {
			return NextResponse.json(
				{ error: "Page not found in OAuth session" },
				{ status: 400 },
			);
		}
		const supabase = createServiceClient();

		// The callback carries the user's long-lived token here; it is stored
		// encrypted in metadata so the refresh cron can re-fetch page tokens
		// via /me/accounts when they near expiry (Meta rejects
		// fb_exchange_token on page tokens directly).
		const metadata = {
			// Default comment-agent config — orgs tune it via metadata.comment_reply.
			comment_reply: DEFAULT_COMMENT_REPLY_CONFIG,
			...(userToken ? { user_access_token: encryptSecret(userToken) } : {}),
		};

		// Store connection in channel_connections
		const { error: insertError } = await supabase
			.from("channel_connections")
			.upsert(
				{
					organization_id: effectiveOrgId,
					channel: "messenger",
					channel_user_id: pageId, // Page ID as user ID for page-level connections
					channel_chat_id: pageId,
					page_id: pageId,
					page_name: pageName,
					page_access_token: encryptSecret(selectedPage.access_token),
					token_encrypted: true,
					token_expires_at: new Date(
						Date.now() + 60 * 24 * 60 * 60 * 1000,
					).toISOString(), // 60 days
					product_type: effectiveProductType,
					is_active: true,
					metadata,
				},
				{
					onConflict: "organization_id,channel,channel_chat_id,channel_user_id",
				},
			);

		if (insertError) {
			return NextResponse.json(
				{ error: "Failed to save page connection" },
				{ status: 500 },
			);
		}

		// Subscribe page to webhook
		const subscribed = await facebookChannel.subscribeToWebhook(
			pageId,
			selectedPage.access_token,
		);

		// Check for Instagram account
		const pageInfo = await facebookChannel.getPageInfo(
			pageId,
			selectedPage.access_token,
		);

		// If Instagram is linked, also store that connection
		if (pageInfo?.instagramBusinessAccount) {
			const igId = pageInfo.instagramBusinessAccount.id;

			await supabase.from("channel_connections").upsert(
				{
					organization_id: effectiveOrgId,
					channel: "instagram",
					channel_user_id: igId,
					channel_chat_id: pageId, // IG messages come through the same page
					page_id: pageId,
					page_name: `${pageName} (Instagram)`,
					page_access_token: encryptSecret(selectedPage.access_token),
					token_encrypted: true,
					token_expires_at: new Date(
						Date.now() + 60 * 24 * 60 * 60 * 1000,
					).toISOString(),
					product_type: effectiveProductType,
					is_active: true,
					metadata,
				},
				{
					onConflict: "organization_id,channel,channel_chat_id,channel_user_id",
				},
			);
		}
		// Set default persistent menu with Cart button — non-blocking, best-effort
		try {
			const menuChannel = new FacebookChannel({
				pageId,
				pageAccessToken: selectedPage.access_token,
			});
			await menuChannel.setPersistentMenu(
				[
					{ type: "postback", title: "🛒 Сагс", payload: "CART_VIEW" },
					{ type: "postback", title: "📦 Бараа", payload: "catalog" },
					{ type: "postback", title: "📋 Захиалга", payload: "order_status" },
				],
				{ composerInputDisabled: false },
			);
			await menuChannel.setGetStarted("GET_STARTED");
			await menuChannel.setGreeting(
				"Сайн уу! Bujin-д тавтай морил. Танд юугаар туслах вэ?",
			);
			await menuChannel.setIceBreakers([
				{ question: "Бүтээгдэхүүн үзэх", payload: "catalog" },
				{ question: "Сагс харах", payload: "cart_view" },
				{ question: "Захиалга шалгах", payload: "order_status" },
				{ question: "Хүргэлт асуух", payload: "delivery" },
			]);
		} catch (menuErr) {
			capture(menuErr, {
				context: "agent-gateway: set default persistent menu",
			});
		}

		// Server-controlled return destination (env per product) — never from
		// client input, so no open-redirect surface.
		const returnUrls: Record<string, string> = {
			zer: process.env.FB_RETURN_URL_ZER ?? "",
			tolom: process.env.FB_RETURN_URL_TOLOM ?? "",
		};
		const response = NextResponse.json({
			success: true,
			message: "Facebook Page connected successfully",
			webhookSubscribed: subscribed,
			instagramLinked: !!pageInfo?.instagramBusinessAccount,
			returnUrl: returnUrls[effectiveProductType] || null,
		});

		response.cookies.set("fb_pages", "", {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
			maxAge: 0,
		});

		response.cookies.set("fb_user_token", "", {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
			maxAge: 0,
		});
		response.cookies.set("fb_select_sid", "", {
			httpOnly: false,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
			maxAge: 0,
		});

		if (sid && redis) {
			await redis.del(`fb:select:${sid}`);
		}
		return response;
	} catch (err) {
		capture(err, { context: "agent-gateway: facebook page select" });
		return NextResponse.json(
			{ error: "Failed to connect page" },
			{ status: 500 },
		);
	}
}
