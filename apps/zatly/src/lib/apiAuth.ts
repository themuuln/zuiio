import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Public routes that don't require auth
// Only webhook and Facebook callback need to be public (Facebook calls them).
// All other routes must authenticate via session.
const PUBLIC_ROUTES = [
  "/api/webhook",
  "/api/facebook/callback",
];

export async function requireAuth(request: Request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return null; // no error
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return null; // authenticated
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
