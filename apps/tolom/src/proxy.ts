import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./lib/i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

const handleI18n = createMiddleware(routing);

const DEFAULT_LOCALE = "mn";

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/guide") || pathname.startsWith("/invoice/")) {
    return NextResponse.next();
  }

  const authResult = await updateSession(request);

  if (pathname.startsWith("/api")) {
    return authResult;
  }

  if (
    authResult.status === 307 ||
    authResult.status === 302 ||
    authResult.headers.get("x-storefront-rewrite")
  ) {
    if (!request.cookies.has("NEXT_LOCALE")) {
      authResult.cookies.set("NEXT_LOCALE", DEFAULT_LOCALE, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
    return authResult;
  }

  const i18nResponse = handleI18n(request);

  // Forward session refresh Set-Cookie headers from auth response so the
  // browser actually receives the refreshed tokens.
  for (const cookie of authResult.headers.getSetCookie()) {
    i18nResponse.headers.append("Set-Cookie", cookie);
  }

  if (!request.cookies.has("NEXT_LOCALE")) {
    i18nResponse.cookies.set("NEXT_LOCALE", DEFAULT_LOCALE, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return i18nResponse;
}

export const config = {
  matcher: "/((?!trpc|_next|_vercel|.*\\..*).*)",
};
