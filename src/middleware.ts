import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/lib/i18n/routing";
import { checkRateLimit } from "@/lib/rate-limit";
import { updateSession } from "@/lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

// Auth routes that need rate limiting
const AUTH_ROUTES = new Set([
  "/auth/login",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/mn/auth/login",
  "/mn/auth/signup",
  "/mn/auth/forgot-password",
  "/mn/auth/reset-password",
  "/en/auth/login",
  "/en/auth/signup",
  "/en/auth/forgot-password",
  "/en/auth/reset-password",
]);

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "127.0.0.1";
}

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ── Rate limiting for auth routes ──────────────────────────────
  if (AUTH_ROUTES.has(pathname)) {
    const ip = getClientIp(request);
    const { allowed, remaining, resetAt } = checkRateLimit(ip);

    if (!allowed) {
      return new NextResponse(
        JSON.stringify({
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests. Please try again later.",
          },
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(
              Math.ceil((resetAt - Date.now()) / 1000),
            ),
            "X-RateLimit-Remaining": "0",
          },
        },
      );
    }

    // Add rate limit headers to the response
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    return response;
  }

  // ── API routes: skip intl, just update session ─────────────
  if (pathname.startsWith("/api")) {
    return await updateSession(request);
  }

  // ── Non-API routes: intl middleware then session refresh ────
  const intlResponse = intlMiddleware(request);
  if (intlResponse) return intlResponse;

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon-.*\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
