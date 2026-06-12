import { NextResponse } from "next/server";
import { createSimpleRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import {
  createOrganization,
  getUserOrganization,
} from "@/lib/services/organization-service";

export const GET = createSimpleRouteHandler(async ({ user, supabase }) => {
  const org = await getUserOrganization(supabase, user.id);
  return NextResponse.json({ data: org });
});

export const POST = createSimpleRouteHandler(
  async ({ request, user, supabase }) => {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const rateCheck = mutationRateLimiter.check(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests" } },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateCheck.resetAt - Date.now()) / 1000),
            ),
          },
        },
      );
    }
    const body = await request.json();
    const { name, slug } = body;
    const org = await createOrganization(supabase, { name, slug }, user.id);
    return NextResponse.json({ data: org }, { status: 201 });
  },
);
