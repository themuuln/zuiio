import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
	// Simple pass-through — Zill is auth-free (uses cookie-based identity, not Supabase auth)
	return NextResponse.next({ request });
}
