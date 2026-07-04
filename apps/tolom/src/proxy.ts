import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./lib/i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

const SUPPORTED = ["en", "mn"];

const handleI18n = createMiddleware(routing);

/** Always use Mongolian ("mn") as the default locale on first visit.
 * Users can switch to English via the locale switcher. */
const DEFAULT_LOCALE = "mn";

/** Set the NEXT_LOCALE cookie on a response. */
function setLocaleCookie(res: NextResponse, locale: string): void {
  res.cookies.set("NEXT_LOCALE", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/guide") || pathname.startsWith("/invoice/")) {
    return NextResponse.next();
  }

  const authResult = await updateSession(request);

  // ── Auth redirects (302/307) ──────────────────────────────
  // These bypass the i18n middleware below, so we must set the
  // locale cookie here to avoid a cookie-less first visit.
  if (
    authResult.status === 307 ||
    authResult.status === 302 ||
    authResult.headers.get("x-storefront-rewrite")
  ) {
    if (!request.cookies.has("NEXT_LOCALE")) {
      setLocaleCookie(authResult, DEFAULT_LOCALE);
    }
    return authResult;
  }

  const i18nResponse = handleI18n(request);

  if (!request.cookies.has("NEXT_LOCALE")) {
    setLocaleCookie(i18nResponse, DEFAULT_LOCALE);
  }

  return i18nResponse;
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
