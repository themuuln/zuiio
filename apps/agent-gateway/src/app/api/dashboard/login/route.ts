import { NextResponse } from "next/server";
import { createSessionValue } from "@/proxy";

export const dynamic = "force-dynamic";

const AUTH_COOKIE = "ag_dash_auth";

// Simple in-memory brute-force throttle (per process).
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10_000;

/**
 * POST /api/dashboard/login — body: { password }
 * Sets an HttpOnly auth cookie when the password matches DASHBOARD_SECRET.
 */
export async function POST(request: Request) {
	const secret = process.env.DASHBOARD_SECRET;
	if (!secret) {
		return NextResponse.json(
			{ error: "Dashboard not configured (DASHBOARD_SECRET unset)" },
			{ status: 503 },
		);
	}

	const ip =
		request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
	const now = Date.now();
	const entry = attempts.get(ip);
	if (entry && entry.resetAt > now && entry.count >= MAX_ATTEMPTS) {
		return NextResponse.json(
			{ error: "Too many attempts. Try again shortly." },
			{ status: 429 },
		);
	}
	if (!entry || entry.resetAt <= now) {
		attempts.set(ip, { count: 0, resetAt: now + WINDOW_MS });
	}

	const body = (await request.json().catch(() => ({}))) as {
		password?: string;
	};
	if (body.password !== secret) {
		const e = attempts.get(ip);
		if (e) e.count += 1;
		return NextResponse.json({ error: "Invalid password" }, { status: 401 });
	}

	attempts.delete(ip);

	const sessionValue = await createSessionValue(secret);
	const response = NextResponse.json({ ok: true });
	response.cookies.set(AUTH_COOKIE, sessionValue, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: 24 * 60 * 60, // 24h
	});
	return response;
}
