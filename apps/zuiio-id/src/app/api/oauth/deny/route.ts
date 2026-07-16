import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/oauth/deny
 * Denies an OAuth authorization request and returns the redirect URL with error.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { redirect_uri, state } = body;

    if (!redirect_uri) {
      return NextResponse.json({ error: "Missing redirect_uri" }, { status: 400 });
    }

    const url = new URL(redirect_uri);
    url.searchParams.set("error", "access_denied");
    url.searchParams.set("error_description", "The user denied the request");
    if (state) {
      url.searchParams.set("state", state);
    }

    return NextResponse.json({ redirect_to: url.toString() });
  } catch (error) {
    console.error("Consent deny error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
