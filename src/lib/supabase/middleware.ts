import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

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

  const pathname = request.nextUrl.pathname;

  const isAuthRoute = pathname.includes("/auth/");
  const isInvoiceRoute = pathname.startsWith("/invoice/");
  const isPortalRoute = pathname.startsWith("/portal");
  const isInviteRoute = pathname.startsWith("/invite/");
  const isPricingRoute = pathname.startsWith("/pricing");
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/features") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/contact") ||
    pathname.startsWith("/faq") ||
    pathname.startsWith("/blog") ||
    pathname.startsWith("/status") ||
    pathname.startsWith("/integrations") ||
    pathname.startsWith("/services");
  const isLoginRoute = pathname.includes("/auth/login");

  if (
    !user &&
    !isAuthRoute &&
    !isInvoiceRoute &&
    !isPortalRoute &&
    !isInviteRoute &&
    !isPricingRoute &&
    !isPublicRoute
  ) {
    const url = request.nextUrl.clone();
    // With localePrefix: "never" the URL has no locale segment
    url.pathname = "/auth/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/select-organization";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

function env(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
}
