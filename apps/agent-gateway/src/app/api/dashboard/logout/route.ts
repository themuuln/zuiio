import { NextResponse } from "next/server";

const AUTH_COOKIE = "ag_dash_auth";

/**
 * POST /api/dashboard/logout — clears the dashboard auth cookie.
 */
export async function POST() {
	const response = NextResponse.json({ ok: true });
	response.cookies.set(AUTH_COOKIE, "", {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: 0,
	});
	return response;
}
