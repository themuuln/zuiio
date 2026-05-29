import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import {
  updateExpenseCategory,
  deleteExpenseCategory,
} from "@/lib/services/expense-service";

export const PATCH = createRouteHandler(
  async ({ request, orgId, params, user }) => {
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
    const { categoryId } = params;
    const body = await request.json();
    const category = await updateExpenseCategory(
      categoryId,
      orgId,
      body,
      user.id,
    );
    return NextResponse.json({ data: category });
  },
);

export const DELETE = createRouteHandler(
  async ({ request, orgId, params, user }) => {
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
    const { categoryId } = params;
    await deleteExpenseCategory(categoryId, orgId, user.id);
    return NextResponse.json({ data: null });
  },
);
