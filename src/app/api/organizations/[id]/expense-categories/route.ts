import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import {
  createExpenseCategory,
  getExpenseCategories as getCategories,
  seedDefaultExpenseCategories,
} from "@/lib/services/expense-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";

export const GET = createRouteHandler(async ({ orgId, user, supabase }) => {
  await seedDefaultExpenseCategories(supabase, orgId, user.id);
  const categories = await getCategories(supabase, orgId);
  return NextResponse.json({ data: categories });
}, { requiredPermission: { resource: "expense_categories", action: "read" } });

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
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
    const category = await createExpenseCategory(
      supabase,
      orgId,
      body,
      user.id,
    );
    return NextResponse.json({ data: category }, { status: 201 });
  },
  { requiredPermission: { resource: "expense_categories", action: "create" } },
);
