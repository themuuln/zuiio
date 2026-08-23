import { capture } from "@zuiio/capture";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { verifyCompactToken } from "@/lib/tokens";

const FB_APP_ID = process.env.FB_APP_ID || "";
const FB_APP_SECRET = process.env.FB_APP_SECRET || "";
const FB_OAUTH_REDIRECT_URI = process.env.FB_OAUTH_REDIRECT_URI || "";
const FB_GRAPH_API_VERSION = process.env.FB_GRAPH_API_VERSION || "v25.0";


/**
 * GET: Facebook OAuth callback handler.
 *
 * Flow:
 * 1. Receive authorization code from Facebook
 * 2. Exchange code for user access token
 * 3. Exchange for long-lived token (60 days)
 * 4. Fetch pages the user manages
 * 5. Redirect to page selection UI
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
	const { searchParams } = new URL(request.url);
	const code = searchParams.get("code");
	const state = searchParams.get("state");
	const stateCookie = request.cookies.get("fb_oauth_state")?.value;
	let stateData: { orgId: string; productType: string; state?: string } | null =
		null;
	// Token-verified starts use the signed compact token as state. The legacy
	// /api/facebook/connect route still uses the cookie-backed JSON state.
	const stateToken = state ? verifyCompactToken(state) : null;
	if (stateToken) {
		stateData = {
			orgId: stateToken.orgId,
			productType: stateToken.productType,
		};
	} else {
		try {
			const parsed = state
				? (JSON.parse(Buffer.from(state, "base64url").toString()) as {
						orgId: string;
						productType: string;
						state?: string;
					})
				: null;
			stateData = parsed;
		} catch {
			stateData = null;
		}

		if (
			!stateData?.state ||
			!stateCookie ||
			!stateData.orgId ||
			!stateData.productType
		) {
			return NextResponse.json(
				{ error: "Invalid OAuth state" },
				{ status: 400 },
			);
		}

		try {
			const cookieData = JSON.parse(stateCookie) as { state?: string };
			if (cookieData.state !== stateData.state) {
				return NextResponse.json(
					{ error: "Invalid OAuth state" },
					{ status: 400 },
				);
			}
		} catch {
			return NextResponse.json(
				{ error: "Invalid OAuth state" },
				{ status: 400 },
			);
		}
	}

	if (!stateData?.orgId || !stateData.productType) {
		return NextResponse.json({ error: "Invalid OAuth state" }, { status: 400 });
	}

	if (!code) {
		return NextResponse.json(
			{ error: "Missing authorization code" },
			{ status: 400 },
		);
	}

	if (!FB_APP_ID || !FB_APP_SECRET || !FB_OAUTH_REDIRECT_URI) {
		return NextResponse.json(
			{ error: "Facebook app not configured" },
			{ status: 500 },
		);
	}

	try {
		// Exchange code for user access token
		const tokenUrl = new URL(
			`https://graph.facebook.com/${FB_GRAPH_API_VERSION}/oauth/access_token`,
		);
		tokenUrl.searchParams.set("client_id", FB_APP_ID);
		tokenUrl.searchParams.set("client_secret", FB_APP_SECRET);
		tokenUrl.searchParams.set("redirect_uri", FB_OAUTH_REDIRECT_URI);
		tokenUrl.searchParams.set("code", code);

		const tokenResponse = await fetch(tokenUrl);
		const tokenData = (await tokenResponse.json()) as {
			access_token?: string;
			expires_in?: number;
			error?: { message?: string };
		};

		if (!tokenResponse.ok || !tokenData.access_token) {
			return NextResponse.json(
				{
					error: tokenData.error?.message || "Failed to exchange access token",
				},
				{ status: 400 },
			);
		}

		// Exchange for long-lived token (60 days)
		const longLivedTokenUrl = new URL(
			`https://graph.facebook.com/${FB_GRAPH_API_VERSION}/oauth/access_token`,
		);
		longLivedTokenUrl.searchParams.set("grant_type", "fb_exchange_token");
		longLivedTokenUrl.searchParams.set("client_id", FB_APP_ID);
		longLivedTokenUrl.searchParams.set("client_secret", FB_APP_SECRET);
		longLivedTokenUrl.searchParams.set(
			"fb_exchange_token",
			tokenData.access_token,
		);

		const longLivedResponse = await fetch(longLivedTokenUrl);
		const longLivedData = (await longLivedResponse.json()) as {
			access_token?: string;
			expires_in?: number;
			error?: { message?: string };
		};

		const userAccessToken =
			longLivedData.access_token ?? tokenData.access_token;

		// Fetch pages the user manages
		const pagesUrl = new URL(
			`https://graph.facebook.com/${FB_GRAPH_API_VERSION}/me/accounts`,
		);
		pagesUrl.searchParams.set("access_token", userAccessToken);
		pagesUrl.searchParams.set("fields", "id,name,access_token");

		const pagesResponse = await fetch(pagesUrl);
		const pagesData = (await pagesResponse.json()) as {
			data?: Array<{ id: string; name: string; access_token: string }>;
			error?: { message?: string };
		};

		if (!pagesResponse.ok || !pagesData.data?.length) {
			return NextResponse.json(
				{ error: pagesData.error?.message || "No Facebook pages found" },
				{ status: 400 },
			);
		}

		// Store pages in cookie for selection
		const response = NextResponse.redirect(
			new URL(
				`/link/select?orgId=${stateData.orgId}&productType=${stateData.productType}`,
				request.url,
			),
		);

		response.cookies.set("fb_pages", JSON.stringify(pagesData.data), {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
			maxAge: 600, // 10 minutes
		});

		// Carry the user's long-lived token to the select step so the page
		// connection can later refresh its page token via /me/accounts (Meta
		// rejects fb_exchange_token on page tokens — the old cron path).
		response.cookies.set("fb_user_token", userAccessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
			maxAge: 600, // 10 minutes
		});

		// Clear state cookie
		response.cookies.set("fb_oauth_state", "", {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
			maxAge: 0,
		});

		return response;
	} catch (err) {
		capture(err, { context: "agent-gateway: facebook OAuth callback" });
		return NextResponse.json(
			{ error: "Failed to process OAuth callback" },
			{ status: 500 },
		);
	}
}
