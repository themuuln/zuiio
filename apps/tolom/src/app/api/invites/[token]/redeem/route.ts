import { createSimpleRouteHandler } from "@/lib/api-handler";
import { apiError, ok } from "@/lib/api-response";
import { authRateLimiter } from "@/lib/rate-limit";
import { redeemInvite } from "@/lib/services/invite-service";
export const POST = createSimpleRouteHandler(
  async ({ request, user, supabase }) => {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const rateCheck = await authRateLimiter.check(ip);
    if (!rateCheck.allowed) {
      return apiError("RATE_LIMITED", "Too many requests", 429, {
        "Retry-After": String(
          Math.ceil((rateCheck.resetAt - Date.now()) / 1000),
        ),
      });
    }
    const token = request.nextUrl.pathname.split("/").at(-2) ?? "";
    const result = await redeemInvite(supabase, token, user.id);
    return ok(result);
  },
);
