import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./lib/i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

const SUPPORTED = ["en", "mn"];

const handleI18n = createMiddleware(routing);

/**
 * Parse Accept-Language header to detect preferred locale.
 * Returns null when the header is absent or indecisive.
 */
function detectLocale(acceptLanguage: string | null): string | null {
  if (!acceptLanguage) return null;
  // next-intl handles the full Accept-Language weighting; we only need
  // a coarse check for the `NEXT_LOCALE` cookie default.
  const idxEn = acceptLanguage.indexOf("en");
  const idxMn = acceptLanguage.indexOf("mn");
  if (idxEn >= 0 && (idxMn < 0 || idxEn < idxMn)) return "en";
  if (idxMn >= 0 && (idxEn < 0 || idxMn < idxEn)) return "mn";
  return null;
}

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
      const detected =
        detectLocale(request.headers.get("accept-language")) ?? "mn";
      setLocaleCookie(authResult, detected);
    }
    return authResult;
  }

  const i18nResponse = handleI18n(request);

  if (!request.cookies.has("NEXT_LOCALE")) {
    const detected =
      detectLocale(request.headers.get("accept-language")) ?? "mn";
    setLocaleCookie(i18nResponse, detected);
  }

  return i18nResponse;
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
