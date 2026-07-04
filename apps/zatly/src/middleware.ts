import { type NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.API_KEY;

/**
 * Middleware that protects /api/ routes with a simple API key check.
 *
 * Excluded from auth:
 *  - /api/webhook — must remain public so Facebook can deliver messages
 *  - Development mode — skipped so the browser-based UI works without
 *    embedding the key in client bundles (single-user admin tool)
 *
 * In production, external callers (scripts, CI, integrations) must send
 * the `x-api-key` header. The browser UI calls go through same-origin
 * and are allowed without the key.
 */
export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Only guard /api/ routes
	if (!pathname.startsWith("/api/")) {
		return NextResponse.next();
	}

	// Webhook must stay public for Facebook deliveries
	if (pathname === "/api/webhook") {
		return NextResponse.next();
	}

	// In development, skip API key checks so the UI works out of the box
	if (process.env.NODE_ENV !== "production") {
		return NextResponse.next();
	}

	// In production, allow same-origin requests (the app's own UI)
	const origin = request.headers.get("origin");
	const host = request.headers.get("host");
	if (origin && host) {
		try {
			const originHost = new URL(origin).host;
			if (originHost === host) {
				return NextResponse.next();
			}
		} catch {
			// Invalid origin header — fall through to API key check
		}
	}

	// For external callers, require the API key
	if (!API_KEY) {
		return NextResponse.json(
			{ error: "Server misconfiguration: API_KEY not set." },
			{ status: 500 },
		);
	}

	const provided = request.headers.get("x-api-key");
	if (!provided || provided !== API_KEY) {
		return NextResponse.json(
			{ error: "Unauthorized: invalid or missing x-api-key header." },
			{ status: 401 },
		);
	}

	return NextResponse.next();
}

export const config = {
	matcher: "/api/:path*",
};
