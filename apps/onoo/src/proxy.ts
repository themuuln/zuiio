import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch {
    // If Supabase env vars are missing, skip session refresh and continue
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: [
    // Match all routes — every request refreshes the session cookie once at the edge
    // so downstream createClient() calls find a fresh cookie and don't make auth API calls.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
