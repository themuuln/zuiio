import { createServerClient } from "@supabase/ssr";
import { capture } from "@zuiio/capture";
import { type NextRequest, NextResponse } from "next/server";
import { PUBLIC_ROUTES } from "@/lib/constants";
import type { Database } from "../database.types";
import { maybeRewriteStorefrontHost } from "./domain-rewrite";
import { getSupabaseEnv } from "./env";

/**
 * Storefront subpaths that are public on the default domain under an org
 * slug: /{slug}, /{slug}/products(+/[id]), /{slug}/cart, /{slug}/blog,
 * /{slug}/account (buyer sign-in / register / orders), /{slug}/wishlist
 * (client-side localStorage list — guests must reach it from the header
 * heart). Dashboard routes (/shop/cart, /products, /settings, /dashboard,
 * …) stay protected because their first segment is a reserved route.
 */
const STOREFRONT_SUBPATHS = ["products", "cart", "blog", "account", "wishlist"];

/**
 * First-path-segments that are ERP dashboard, static, or infrastructure
 * routes — never org storefronts. Classifying storefront paths against this
 * list (instead of a per-request `organizations.slug` lookup) keeps the
 * proxy DB-free: a slug that is not reserved falls through to the server,
 * which renders the storefront or 404s for unknown orgs. Static segments
 * always win over the dynamic `[slug]` route in Next's router, so a future
 * org slug colliding with a reserved segment behaves the same as today
 * (its storefront stays reachable via custom domain / subdomain).
 */
const RESERVED_FIRST_SEGMENTS = new Set([
  // ERP dashboard route groups (app/(dashboard)/*).
  "accounting",
  "ai",
  "ai-assistant",
  "audit",
  "blog",
  "bom",
  "budget",
  "cash-register",
  "commissions",
  "coupons",
  "customers",
  "deliveries",
  "discounts",
  "expenses",
  "gift-cards",
  "hr",
  "inventory",
  "invoices",
  "loyalty",
  "pos",
  "production",
  "products",
  "promotions",
  "purchases",
  "quality",
  "quotations",
  "reports",
  "returns",
  "reviews",
  "sales",
  "settings",
  "shop",
  "suppliers",
  "webhooks",
  // Root-level static pages (legal / meta).
  "about",
  "contact",
  "privacy",
  "terms",
  // Infrastructure segments.
  "api",
  "auth",
  "dashboard",
  "embed",
  "r",
  "terminal",
]);

/**
 * True when `pathname` looks like a storefront path (single segment or a
 * known storefront subpath) whose first segment is not a reserved ERP or
 * static route. Runs only for anonymous visitors on non-public paths.
 * Unknown slugs pass through — the server renders a 404 for them.
 */
function isPublicStorefrontPath(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return false;
  if (segments.length > 1 && !STOREFRONT_SUBPATHS.includes(segments[1])) {
    return false;
  }
  return !RESERVED_FIRST_SEGMENTS.has(segments[0]);
}

export async function updateSession(request: NextRequest) {
  // Custom-domain / subdomain storefront rewrite (before auth checks):
  // public storefront pages must render under the requested host.
  const domainRewrite = await maybeRewriteStorefrontHost(request);
  if (domainRewrite) return domainRewrite;

  let supabaseResponse = NextResponse.next({ request });
  const { anonKey, url } = getSupabaseEnv();

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        supabaseResponse = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, options);
        }
      },
    },
  });

  let userId: string | null = null;
  try {
    const { data } = await supabase.auth.getClaims();
    userId = data?.claims?.sub ?? null;
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

  // Allow cron API routes without auth (they use CRON_SECRET Bearer token instead).
  const isCronRoute = request.nextUrl.pathname.startsWith("/api/cron/");

  // Allow public storefront pages on the default domain (/{slug} and its
  // storefront subpaths) — classified statically so the proxy makes no DB
  // round trip; unknown slugs fall through to the server (404). Only
  // consulted for anonymous visitors.
  const isStorefrontRoute = !userId
    ? isPublicStorefrontPath(request.nextUrl.pathname)
    : false;

  // Public landing for anonymous visitors on the app root. Authenticated
  // users keep the dashboard home at "/" (app/(dashboard)/page.tsx) — a
  // root page.tsx would shadow it for everyone.
  if (!userId && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/landing";
    const response = NextResponse.redirect(url);
    for (const cookie of supabaseResponse.headers.getSetCookie()) {
      response.headers.append("Set-Cookie", cookie);
    }
    return response;
  }

  if (
    !userId &&
    !isPublicRoute &&
    !isShareRoute &&
    !isStorefrontRoute &&
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
    // (getClaims() may have refreshed or cleared session cookies via setAll)
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
    userId &&
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
  if (userId) {
    supabaseResponse.headers.set("x-authed-user-id", userId);
  }

  return supabaseResponse;
}
