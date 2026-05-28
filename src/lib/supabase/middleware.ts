import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { matchRoutes } from "./auth-routes";
import { env } from "./env";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    env("NEXT_PUBLIC_SUPABASE_URL"),
    env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
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

  return supabaseResponse;
}
