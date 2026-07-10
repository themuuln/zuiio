import { createSimpleRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";
import { authRateLimiter } from "@/lib/rate-limit";
import { reportServerError } from "@/lib/sentry-report-server";
import { finalizeSignup } from "@/lib/services/signup-service";

export const POST = createSimpleRouteHandler(async ({ request, supabase }) => {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateCheck = await authRateLimiter.check(ip);
  if (!rateCheck.allowed) {
    return apiError("RATE_LIMITED", "Too many requests", 429, {
      "Retry-After": String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)),
    });
  }

  let orgName: string | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    orgName = body?.orgName ?? undefined;
  } catch {
    reportServerError("Unexpected error");
    // no body or invalid JSON — proceed without orgName override
  }

  const result = await finalizeSignup(supabase, { orgName });
  return ok(result);
});
