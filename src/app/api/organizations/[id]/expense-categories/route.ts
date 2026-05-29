import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import {
  getExpenseCategories as getCategories,
  createExpenseCategory,
  seedDefaultExpenseCategories,
} from "@/lib/services/expense-service";

export const GET = createRouteHandler(async ({ orgId, user }) => {
  await seedDefaultExpenseCategories(orgId, user.id);
  const categories = await getCategories(orgId);
  return NextResponse.json({ data: categories });
});

export const POST = createRouteHandler(async ({ request, orgId, user }) => {
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
  const category = await createExpenseCategory(orgId, body, user.id);
  return NextResponse.json({ data: category }, { status: 201 });
});
