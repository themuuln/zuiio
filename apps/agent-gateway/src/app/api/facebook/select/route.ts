import { capture } from "@zuiio/capture";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { FacebookChannel } from "@zuiio/gateway-facebook";
import { encryptSecret } from "@/lib/crypto";
import { createServiceClient } from "@/lib/supabase";


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
/**
 * GET: Read the non-sensitive page list from the OAuth session.
 *
 * Page access tokens stay in the httpOnly cookie and are never returned to
 * browser JavaScript. The POST handler reads the same cookie when connecting.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
	const pagesCookie = request.cookies.get("fb_pages")?.value;
	if (!pagesCookie) {
		return NextResponse.json(
			{ error: "OAuth session expired. Please try again." },
			{ status: 400 },
		);
	}

	try {
		const pages = JSON.parse(pagesCookie) as Array<{
			id: string;
			name: string;
			access_token: string;
		}>;
		const safePages = pages.map(({ id, name }) => ({ id, name }));
		return NextResponse.json({ pages: safePages });
	} catch (err) {
		capture(err, { context: "agent-gateway: facebook page list" });
		return NextResponse.json(
			{ error: "OAuth session is invalid. Please try again." },
			{ status: 400 },
		);
	}
}

export async function POST(request: NextRequest): Promise<NextResponse> {
	try {
		const body = (await request.json()) as {
			pageId?: string;
			pageName?: string;
			orgId?: string;
			productType?: string;
		};

		const { pageId, pageName, orgId, productType } = body;

		if (!pageId || !pageName || !orgId) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 },
			);
		}

		// Get pages from cookie
		const pagesCookie = request.cookies.get("fb_pages")?.value;
		if (!pagesCookie) {
			return NextResponse.json(
				{ error: "OAuth session expired. Please try again." },
				{ status: 400 },
			);
		}

		const pages = JSON.parse(pagesCookie) as Array<{
			id: string;
			name: string;
			access_token: string;
		}>;

		// Find the selected page
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
		const userToken = request.cookies.get("fb_user_token")?.value;
		const metadata = userToken
			? { user_access_token: encryptSecret(userToken) }
			: {};

		// Store connection in channel_connections
		const { error: insertError } = await supabase
			.from("channel_connections")
			.upsert(
				{
					organization_id: orgId,
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
					product_type: productType || "zer",
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

		const facebookChannel = new FacebookChannel({
			pageId,
			pageAccessToken: selectedPage.access_token,
		});
		const subscribed = await facebookChannel.subscribeToWebhook();
		const pageInfo = await facebookChannel.getPageInfo();

		// If Instagram is linked, also store that connection
		if (pageInfo?.instagramBusinessAccount) {
			const igId = pageInfo.instagramBusinessAccount.id;

			await supabase.from("channel_connections").upsert(
				{
					organization_id: orgId,
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
					product_type: productType || "zer",
					is_active: true,
					metadata,
				},
				{
					onConflict: "organization_id,channel,channel_chat_id,channel_user_id",
				},
			);
		}

		// Clear pages + user-token cookies
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
			returnUrl: returnUrls[productType || "zer"] || null,
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

		return response;
	} catch (err) {
		capture(err, { context: "agent-gateway: facebook page select" });
		return NextResponse.json(
			{ error: "Failed to connect page" },
			{ status: 500 },
		);
	}
}
