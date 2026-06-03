import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { createBranch, getBranches } from "@/lib/services/branch-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";

export const GET = createRouteHandler(
  async ({ orgId, supabase }) => {
    const branches = await getBranches(supabase, orgId);
    return NextResponse.json({ data: branches });
  },
  { requiredPermission: { resource: "branches", action: "read" } },
);

export const POST = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    await requireActiveSubscription(orgId);
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
    const branch = await createBranch(supabase, orgId, body);
    return NextResponse.json({ data: branch }, { status: 201 });
  },
  { requiredPermission: { resource: "branches", action: "create" } },
);
