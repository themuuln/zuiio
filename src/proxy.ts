import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./lib/i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

const handleI18n = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/guide") ||
    pathname.startsWith("/invoice/")
  ) {
    return NextResponse.next();
  }

  const authResult = await updateSession(request);
  if (authResult.status === 307 || authResult.status === 302) {
    return authResult;
  }

  const i18nResponse = handleI18n(request);

  if (!request.cookies.has("NEXT_LOCALE")) {
    const acceptLang = request.headers.get("accept-language") ?? "";
    const preferred = acceptLang.split(",")[0]?.split("-")[0]?.trim();
    const locale = preferred === "mn" || preferred === "en" ? preferred : "mn";
    i18nResponse.cookies.set("NEXT_LOCALE", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return i18nResponse;
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
