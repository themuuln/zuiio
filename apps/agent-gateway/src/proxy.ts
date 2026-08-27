import { type NextRequest, NextResponse } from "next/server";

export const config = {
	// Protect the dashboard page and its APIs. The webhook/cron/link surfaces
	// are intentionally excluded — they have their own auth (secrets/tokens).
	matcher: ["/dashboard/:path*", "/api/dashboard/:path*"],
};

const AUTH_COOKIE = "ag_dash_auth";

function timingSafeEqualStr(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return diff === 0;
}
/**
 * Session-less dashboard gate: the login route sets an HttpOnly cookie whose
 * value is an HMAC-SHA256 of DASHBOARD_SECRET. The cookie cannot be forged
 * without the secret, and clearing it logs out. Fine for an internal ops
 * dashboard; the SSO upgrade path is documented in docs/PRODUCTION.md.
 */
export async function proxy(request: NextRequest) {
	// Login/logout must be reachable.
	if (
		request.nextUrl.pathname === "/api/dashboard/login" ||
		request.nextUrl.pathname === "/api/dashboard/logout"
	) {
		return NextResponse.next();
	}

	const secret = process.env.DASHBOARD_SECRET;
	if (!secret) {
		// Fail closed: dashboard unavailable when not configured.
		if (request.nextUrl.pathname.startsWith("/api/")) {
			return NextResponse.json(
				{ error: "Dashboard not configured (DASHBOARD_SECRET unset)" },
				{ status: 503 },
			);
		}
		return new NextResponse("Dashboard not configured", { status: 503 });
	}

	const cookie = request.cookies.get(AUTH_COOKIE)?.value;
	const expected = await createSessionValue(secret);
	if (!cookie || !timingSafeEqualStr(cookie, expected)) {
		if (request.nextUrl.pathname.startsWith("/api/")) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		return NextResponse.redirect(new URL("/dashboard/login", request.url));
	}

	return NextResponse.next();
}

export async function createSessionValue(secret: string): Promise<string> {
	const enc = new TextEncoder();
	const key = await crypto.subtle.importKey(
		"raw",
		enc.encode(`agent-gateway-dashboard:${secret}`),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const sig = await crypto.subtle.sign(
		"HMAC",
		key,
		enc.encode("agent-gateway-dashboard-session"),
	);
	const bytes = new Uint8Array(sig);
	let b64 = "";
	for (const b of bytes) b64 += String.fromCharCode(b);
	return `v1:${btoa(b64)}`;
}
