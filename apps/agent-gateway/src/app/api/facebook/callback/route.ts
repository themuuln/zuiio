import { createHmac, timingSafeEqual } from "node:crypto";

import { capture } from "@zuiio/capture";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { FacebookChannel } from "@/channels/facebook";
import { getRedis } from "@/lib/redis";

const FB_APP_ID = process.env.FB_APP_ID || "";
const FB_APP_SECRET = process.env.FB_APP_SECRET || "";
const FB_OAUTH_REDIRECT_URI = process.env.FB_OAUTH_REDIRECT_URI || "";
const FB_GRAPH_API_VERSION = process.env.FB_GRAPH_API_VERSION || "v25.0";

function tokenSecret(): string {
	return process.env.TOKEN_SIGNING_SECRET || "dev-fallback";
}

function timingSafeEqualStr(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	const bufA = Buffer.from(a, "utf8");
	const bufB = Buffer.from(b, "utf8");
	if (bufA.length !== bufB.length) return false;
	try {
		return timingSafeEqual(bufA, bufB);
	} catch {
		return false;
	}
}

function verifyStateSignature(
	stateData: { orgId: string; productType: string; state: string },
	sig: string,
): boolean {
	const payload = JSON.stringify({
		orgId: stateData.orgId,
		productType: stateData.productType,
		state: stateData.state,
	});
	// Support rollout: old sigs are 12 chars, new are 16.
	const sliceLen = sig.length === 12 ? 12 : 16;
	const expected = createHmac("sha256", tokenSecret())
		.update(payload)
		.digest("base64url")
		.slice(0, sliceLen);
	return timingSafeEqualStr(expected, sig);
}


const _facebookChannel = new FacebookChannel();

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

	// Verify state: new signed format is base64url(JSON with sig) + ".<sig12>",
	// legacy is base64url(JSON) with cookie verifier. Support both for rollout.
	const stateCookie = request.cookies.get("fb_oauth_state")?.value;
	let stateData: {
		orgId: string;
		productType: string;
		state?: string;
		sig?: string;
	} | null = null;
	try {
		if (!state) throw new Error("missing state");
		// Try signed format first: "<payloadB64>.<sig16>" (new) with 12-char fallback for rollout.
		const dot = state.lastIndexOf(".");
		const sigLen = state.length - dot - 1;
		if (dot > 0 && (sigLen === 16 || sigLen === 12)) {
			const payloadB64 = state.slice(0, dot);
			const sig = state.slice(dot + 1);
			const parsed = JSON.parse(
				Buffer.from(payloadB64, "base64url").toString(),
			) as { orgId: string; productType: string; state?: string };
			if (
				parsed.state &&
				verifyStateSignature(
					{
						orgId: parsed.orgId,
						productType: parsed.productType,
						state: parsed.state,
					},
					sig,
				)
			) {
				stateData = { ...parsed, sig };
			} else {
				throw new Error("bad sig");
			}
		} else {
			// Legacy: base64url(JSON) + cookie check
			const parsedLegacy = JSON.parse(
				Buffer.from(state, "base64url").toString(),
			) as {
				orgId: string;
				productType: string;
				state?: string;
			};
			stateData = parsedLegacy;
			if (
				!stateData?.state ||
				!stateCookie ||
				!stateData.orgId ||
				!stateData.productType
			)
				throw new Error("missing fields");
			const cookieData = JSON.parse(stateCookie) as { state?: string };
			if (cookieData.state !== stateData.state) throw new Error("mismatch");
		}
	} catch {
		stateData = null;
	}

	if (!stateData?.state || !stateData.orgId || !stateData.productType) {
		return NextResponse.json({ error: "Invalid OAuth state" }, { status: 400 });
	}
	try {
		const _cookieData = stateCookie
			? (JSON.parse(stateCookie) as { state?: string })
			: null;
		if (
			stateData.sig == null &&
			_cookieData &&
			_cookieData.state !== stateData.state
		) {
			return NextResponse.json(
				{ error: "Invalid OAuth state" },
				{ status: 400 },
			);
		}
	} catch {
		if (stateData.sig == null)
			return NextResponse.json(
				{ error: "Invalid OAuth state" },
				{ status: 400 },
			);
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
		// Store pages in Redis (primary) and cookie (fallback) for selection
		// Redis avoids 4KB cookie limit and third-party cookie blocking.
		try {
			const redis = getRedis();
			if (redis && stateData.state) {
				await redis.set(
					`fb:select:${stateData.state}`,
					JSON.stringify({
						pages: pagesData.data,
						userToken: userAccessToken,
						orgId: stateData.orgId,
						productType: stateData.productType,
					}),
					{ ex: 600 },
				);
			}
		} catch {}

		const response = NextResponse.redirect(
			new URL(
				`/link/select?orgId=${stateData.orgId}&productType=${stateData.productType}&sid=${stateData.state}`,
				request.url,
			),
		);
		// Cookie fallback must NOT contain access_token — JS-readable, XSS risk.
		// Store only {id, name} for the client; full tokens stay in Redis.
		const cookiePages = pagesData.data.map(({ id, name }) => ({ id, name }));
		response.cookies.set(
			"fb_pages",
			encodeURIComponent(JSON.stringify(cookiePages)),
			{
				httpOnly: false,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				path: "/",
				maxAge: 600, // 10 minutes
			},
		);
		response.cookies.set("fb_select_sid", stateData.state, {
			httpOnly: false,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
			maxAge: 600,
		});
		// Carry the user's long-lived token to the select step so the page
		// connection can later refresh its page token via /me/accounts (Meta
		// rejects fb_exchange_token on page tokens — the old cron path).
		response.cookies.set("fb_user_token", userAccessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
			maxAge: 600,
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
