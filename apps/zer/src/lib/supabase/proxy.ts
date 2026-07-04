import { capture } from "@zuiio/capture";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
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

  let user: User | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (e) {
    // Session is invalid — treat as unauthenticated.
    capture(e, { context: "middleware session validation" });
  }

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) =>
      request.nextUrl.pathname === route ||
      request.nextUrl.pathname.startsWith(`${route}/`),
  );

  // Allow public share links (/r/[token]) without auth.
  const isShareRoute = request.nextUrl.pathname.startsWith("/r/");

  // Allow public org product pages (/{slug}/products) without auth.
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

    // ── Redirect loop guard ─────────────────────────────────────
    // Detect when the same unauthenticated redirect path fires repeatedly
    // within a short window. This prevents infinite redirect loops.
    const REDIRECT_WINDOW_MS = 30_000;
    const REDIRECT_MAX = 3;
    const redirectCookie = request.cookies.get("__redirect_count");
    const redirectCount = redirectCookie
      ? parseInt(redirectCookie.value, 10) || 0
      : 0;

    if (redirectCount >= REDIRECT_MAX) {
      capture(
        `[redirect-loop] Breaking loop: ${request.nextUrl.pathname} (×${redirectCount + 1})`,
        { context: "middleware redirect loop" },
      );

      return new NextResponse(
        `<!DOCTYPE html>
<html lang="mn">
<head><meta charset="utf-8"><title>Системд алдаа гарлаа</title>
<style>
  body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 2rem; }
  .card { max-width: 480px; text-align: center; }
  h1 { font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem; }
  p { color: #666; line-height: 1.5; }
</style></head>
<body><div class="card">
  <h1>Системд алдаа гарлаа</h1>
  <p>Дахин чиглүүлэлтийн хязгаарт хүрсэн байна. Хэрэв энэ асуудал давтагдвал админдаа хандана уу.</p>
  <p style="font-size:0.85rem;color:#999;margin-top:1rem;">
    redirect loop detected &middot; ${request.nextUrl.pathname} &middot; &times;${redirectCount + 1}
  </p>
</div></body></html>`,
        {
          status: 500,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            // Clear the cookie so a refresh retries fresh
            "Set-Cookie":
              "__redirect_count=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax",
          },
        },
      );
    }

    // Increment redirect count
    const response = NextResponse.redirect(url);

    // Forward any auth cookie changes from supabaseResponse
    // (getUser() may have refreshed or cleared session cookies via setAll)
    for (const cookie of supabaseResponse.headers.getSetCookie()) {
      response.headers.append("Set-Cookie", cookie);
    }

    response.cookies.set("__redirect_count", String(redirectCount + 1), {
      maxAge: REDIRECT_WINDOW_MS / 1000,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
    return response;
  }

  // Redirect authenticated users away from auth pages
  if (
    user &&
    (request.nextUrl.pathname === "/login" ||
      request.nextUrl.pathname === "/register")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    const authRedirect = NextResponse.redirect(url);
    // Forward any auth cookie refreshes so the browser always has the latest session
    for (const cookie of supabaseResponse.headers.getSetCookie()) {
      authRedirect.headers.append("Set-Cookie", cookie);
    }
    return authRedirect;
  }

  // Clear the redirect counter on successful page loads (no redirect happened)
  if (request.cookies.get("__redirect_count")) {
    supabaseResponse.cookies.set("__redirect_count", "", {
      maxAge: 0,
      path: "/",
    });
  }

  // Pass user ID as a header so consumers can avoid a duplicate getUser() call.
  if (user) {
    supabaseResponse.headers.set("x-authed-user-id", user.id);
  }

  return supabaseResponse;
}
