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

  const routes = matchRoutes(request.nextUrl.pathname);

  if (
    !user &&
    !routes.isAuthRoute &&
    !routes.isInvoiceRoute &&
    !routes.isPortalRoute &&
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

  return supabaseResponse;
}
