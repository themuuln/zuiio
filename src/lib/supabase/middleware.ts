import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { matchRoutes } from "./auth-routes";
import { env, getSupabaseKey } from "./env";

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
          supabaseResponse = NextResponse.next({
            request,
          });
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
    "invoice",
    "booking",
    "portal",
    "invite",
    "pricing",
    "guide",
    "super-admin",
    "favicon.ico",
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
    return NextResponse.redirect(url);
  }

  if (user && routes.isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/select-organization";
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
    // Copy cookies from supabase session refresh
    for (const cookie of supabaseResponse.cookies.getAll()) {
      rewritten.cookies.set(cookie.name, cookie.value, cookie);
    }
    return rewritten;
  }

  return supabaseResponse;
}
