import crypto from "node:crypto";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getFacebookOAuthScopes } from "@/lib/facebook-scopes";
import { verifyCompactToken } from "@/lib/tokens";

const FB_APP_ID = process.env.FB_APP_ID || "";
const FB_OAUTH_REDIRECT_URI = process.env.FB_OAUTH_REDIRECT_URI || "";
const FB_GRAPH_API_VERSION = process.env.FB_GRAPH_API_VERSION || "v25.0";

function corsHeaders(origin: string | null): Record<string, string> {
	const allowed =
		origin &&
		(origin.includes("zer.mn") ||
			origin.includes("bujin.mn") ||
			origin.includes("localhost") ||
			origin.includes("192.168.") ||
			origin.includes("vercel.app"));
	return {
		"Access-Control-Allow-Origin": allowed ? origin : "https://zer.mn",
		"Access-Control-Allow-Methods": "POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, Authorization",
		"Access-Control-Allow-Credentials": "true",
	};
}

export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
	return new NextResponse(null, {
		status: 204,
		headers: corsHeaders(request.headers.get("origin")),
	});
}

/**
 * POST: Start Facebook OAuth flow with a verified compact link token.
 *
 * Body: { token }
 *
 * Security: orgId/productType come from the HMAC-verified token, never from
 * raw URL params. Returns the Facebook dialog URL; the browser redirects there.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
	const body = (await request.json().catch(() => ({}))) as {
		token?: string;
	};

	if (!body.token) {
		return NextResponse.json({ error: "token is required" }, { status: 400 });
	}

	const decoded = verifyCompactToken(body.token);
	if (!decoded) {
		return NextResponse.json(
			{ error: "Invalid or expired link token" },
			{ status: 401 },
		);
	}

	if (!FB_APP_ID || !FB_OAUTH_REDIRECT_URI) {
		return NextResponse.json(
			{ error: "Facebook app not configured" },
			{ status: 500 },
		);
	}

	// State carries orgId + productType (from the verified token) plus a nonce.
	const nonce = crypto.randomUUID();
	const stateData = JSON.stringify({
		orgId: decoded.orgId,
		productType: decoded.productType,
		state: nonce,
	});
	const dialogUrl =
		`https://www.facebook.com/${FB_GRAPH_API_VERSION}/dialog/oauth?` +
		new URLSearchParams({
			client_id: FB_APP_ID,
			redirect_uri: FB_OAUTH_REDIRECT_URI,
			scope: getFacebookOAuthScopes(),
			state: Buffer.from(stateData).toString("base64url"),
			response_type: "code",
		});

	const response = NextResponse.json(
		{ redirectUrl: dialogUrl },
		{ headers: corsHeaders(request.headers.get("origin")) },
	);

	// State cookie for the callback round-trip verification.
	response.cookies.set("fb_oauth_state", stateData, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: 600, // 10 minutes
	});

	return response;
}
