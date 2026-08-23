
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getFacebookOAuthScopes } from "@/lib/facebook-scopes";
import { verifyCompactToken } from "@/lib/tokens";

const FB_APP_ID = process.env.FB_APP_ID || "";
const FB_OAUTH_REDIRECT_URI = process.env.FB_OAUTH_REDIRECT_URI || "";
const FB_GRAPH_API_VERSION = process.env.FB_GRAPH_API_VERSION || "v25.0";

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

	if (!verifyCompactToken(body.token)) {
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

	const dialogUrl =
		`https://www.facebook.com/${FB_GRAPH_API_VERSION}/dialog/oauth?` +
		new URLSearchParams({
			client_id: FB_APP_ID,
			redirect_uri: FB_OAUTH_REDIRECT_URI,
			scope: getFacebookOAuthScopes(),
			// The compact token is HMAC-authenticated and carries the org and
			// product. The callback can verify it without a browser cookie;
			// Zer calls this route server-to-server before browser navigation.
			state: body.token,
			response_type: "code",
		});

	return NextResponse.json({ redirectUrl: dialogUrl });
}
