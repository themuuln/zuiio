import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { matchRoutes } from "./auth-routes";
import { env, getSupabaseKey } from "./env";
import { capture } from "@/lib/capture";

/**
 * Detect and break redirect loops.
 * Returns a 500 error response when the same redirect fires too many times.
 */
function guardRedirect(
  request: NextRequest,
  url: NextResponse,
): NextResponse | null {
  const REDIRECT_WINDOW_S = 30;
  const REDIRECT_MAX = 3;
  const redirectCookie = request.cookies.get("__redirect_count");
  const redirectCount = redirectCookie
    ? parseInt(redirectCookie.value, 10) || 0
    : 0;

  if (redirectCount >= REDIRECT_MAX) {
    capture("redirect-loop", { pathname: request.nextUrl.pathname, count: redirectCount + 1 });

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
  <p>Дахин чиглүүлэлтийн хязгаарт хүрсэн байна.</p>
  <p style="font-size:0.85rem;color:#999;margin-top:1rem;">
    redirect loop detected &middot; ×${redirectCount + 1}
  </p>
</div></body></html>`,
      {
        status: 500,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Set-Cookie":
            "__redirect_count=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax",
        },
      },
    );
  }

  // Increment and attach the cookie
  const response = url;
  response.cookies.set("__redirect_count", String(redirectCount + 1), {
    maxAge: REDIRECT_WINDOW_S,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });
  return null; // no loop detected, proceed normally
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    env("NEXT_PUBLIC_SUPABASE_URL"),
    getSupabaseKey(),
    {
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
    },
  );

  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  // Rewrite /{org-slug} and /{org-slug}/parts → /en/{org-slug}/parts
  const pathname = request.nextUrl.pathname;
  const isLocale = pathname.startsWith("/en/") || pathname.startsWith("/mn/");
  // Match /{slug}/parts or bare /{slug} (single segment, not a locale)
  const storefrontMatch = !isLocale
    ? pathname.match(/^\/([^/]+)(?:\/(.*))?$/)
    : null;
  const slug = storefrontMatch?.[1] as string | undefined;
  const subPath = storefrontMatch?.[2] as string | undefined;
  // Reserved paths that should never be treated as org slugs
  const RESERVED = new Set([
    "auth",
    "dashboard",
    "api",
    "_next",
    "favicon.ico",
    "manifest.json",
    "sw.js",
    "workbox",
  ]);
  const isStorefrontPath =
    !!slug &&
    !RESERVED.has(slug) &&
    (!subPath || subPath === "parts" || subPath.startsWith("parts/"));

  let resolvedPathname = pathname;
  if (isStorefrontPath) {
    resolvedPathname = `/en/${slug}/parts`;
  }

  const routes = matchRoutes(resolvedPathname);

  if (
    !user &&
    !routes.isAuthRoute &&
    !routes.isInvoiceRoute &&
    !routes.isPortalRoute &&
    !routes.isBookingRoute &&
    !routes.isStorefrontRoute &&
    !routes.isInviteRoute &&
    !routes.isPricingRoute &&
    !routes.isPublicRoute
  ) {
    const url = request.nextUrl.clone();
    // With localePrefix: "never" the URL has no locale segment
    url.pathname = "/auth/login";
    url.searchParams.set("redirectTo", request.nextUrl.pathname);

    const loop = guardRedirect(request, NextResponse.redirect(url));
    if (loop) return loop;
    return NextResponse.redirect(url);
  }

  if (user && routes.isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/select-organization";

    const loop = guardRedirect(request, NextResponse.redirect(url));
    if (loop) return loop;
    return NextResponse.redirect(url);
  }

  // Role-based access control for owner-only and admin routes
  if (user && (routes.isOwnerRoute || routes.isAdminRoute)) {
    const { data: membership } = await supabase
      .from("organization_users")
      .select("role_id, roles!inner(name)")
      .eq("user_id", user.sub)
      .eq("is_primary", true)
      .is("removed_at", null)
      .maybeSingle();

    const rawRoles = membership?.roles;
    const roleName =
      rawRoles === null || rawRoles === undefined
        ? null
        : Array.isArray(rawRoles)
          ? (rawRoles[0]?.name ?? null)
          : ((rawRoles as unknown as { name: string }).name ?? null);

    // Owner-only routes — redirect non-owners to dashboard
    if (routes.isOwnerRoute && roleName !== "Org Owner") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    // Super admin routes — check super_admins table
    if (routes.isAdminRoute) {
      const { data: superAdmin } = await supabase
        .from("super_admins")
        .select("user_id")
        .eq("user_id", user.sub)
        .maybeSingle();
      if (!superAdmin) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    }
  }

  // Apply storefront rewrite: /{slug}/parts → /en/{slug}/parts
  if (isStorefrontPath) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = resolvedPathname;
    const rewritten = NextResponse.rewrite(rewriteUrl, {
      request: { headers: request.headers },
      headers: { "x-storefront-rewrite": "1" },
    });
    // Carry over the __redirect_count cookie so it clears on success
    const countCookie = request.cookies.get("__redirect_count");
    if (countCookie) {
      rewritten.cookies.set("__redirect_count", countCookie.value, {
        maxAge: 30,
        path: "/",
        httpOnly: true,
        sameSite: "lax",
      });
    }
    return rewritten;
  }

  // Clear the redirect counter on successful page loads (no redirect happened)
  if (request.cookies.get("__redirect_count")) {
    supabaseResponse.cookies.set("__redirect_count", "", {
      maxAge: 0,
      path: "/",
    });
  }

  return supabaseResponse;
}
