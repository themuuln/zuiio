import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    },
  );

  // Call getUser() on every request to refresh the session cookie at the edge.
  // This ensures all downstream createClient() calls find a fresh session cookie
  // and don't need to call the auth API for token refresh — preventing 429 rate limits.
  // For anonymous users, this returns null — no auth traffic is generated.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Only redirect to login on protected routes when the user isn't authenticated
  const pathname = request.nextUrl.pathname;
  const isProtectedRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/tracker");

  if (isProtectedRoute && !user && !pathname.startsWith("/admin/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
