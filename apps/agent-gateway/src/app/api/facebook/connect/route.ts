import crypto from "crypto";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const FB_APP_ID = process.env.FB_APP_ID || "";
const FB_OAUTH_REDIRECT_URI = process.env.FB_OAUTH_REDIRECT_URI || "";
const FB_GRAPH_API_VERSION = process.env.FB_GRAPH_API_VERSION || "v25.0";

/**
 * GET: Start Facebook OAuth flow.
 * Redirects to Facebook's OAuth dialog with required permissions.
 *
 * Query params:
 * - orgId: Organization ID to connect the page to
 * - productType: "tolom" or "zer"
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
	const { searchParams } = new URL(request.url);
	const orgId = searchParams.get("orgId");
	const productType = searchParams.get("productType") || "zer";

	if (!orgId) {
		return NextResponse.json({ error: "Missing orgId parameter" }, { status: 400 });
	}

	if (!FB_APP_ID || !FB_OAUTH_REDIRECT_URI) {
		return NextResponse.json({ error: "Facebook app not configured" }, { status: 500 });
	}

	// Generate state token with orgId + productType
	const state = crypto.randomUUID();
	const stateData = JSON.stringify({ orgId, productType, state });

	// Store state in cookie for verification
	const response = NextResponse.redirect(
		`https://www.facebook.com/${FB_GRAPH_API_VERSION}/dialog/oauth?` +
			new URLSearchParams({
				client_id: FB_APP_ID,
				redirect_uri: FB_OAUTH_REDIRECT_URI,
				scope: [
					"pages_messaging",
					"pages_show_list",
					"pages_manage_metadata",
					"instagram_basic",
					"instagram_manage_messages",
				].join(","),
				state: Buffer.from(stateData).toString("base64url"),
				response_type: "code",
			}),
	);

	// Set state cookie
	response.cookies.set("fb_oauth_state", stateData, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: 600, // 10 minutes
	});

	return response;
}
