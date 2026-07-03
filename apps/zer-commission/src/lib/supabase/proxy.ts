import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { PUBLIC_ROUTES } from "@/lib/constants";
import { getSupabaseEnv } from "./env";
import type { Database } from "./types";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { anonKey, url } = getSupabaseEnv();

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) =>
      request.nextUrl.pathname === route ||
      request.nextUrl.pathname.startsWith(`${route}/`),
  );

  // Allow public share links (/r/[token]) without auth.
  // The /r/[token] page handles data access via the get_public_report_data RPC function.
  const isShareRoute = request.nextUrl.pathname.startsWith("/r/");

  // Allow public org product pages (/{slug}/products) without auth.
  // Data access is handled by the get_public_products SECURITY DEFINER function.
  const isPublicProductsRoute = /^\/[^/]+\/products(\/|$)/.test(
    request.nextUrl.pathname,
  );

  // Allow cron API routes without auth (they use CRON_SECRET Bearer token instead).
  const isCronRoute = request.nextUrl.pathname.startsWith("/api/cron/");

  if (
    !user &&
    !isPublicRoute &&
    !isShareRoute &&
    !isPublicProductsRoute &&
    !isCronRoute
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (
    user &&
    (request.nextUrl.pathname === "/login" ||
      request.nextUrl.pathname === "/register")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
