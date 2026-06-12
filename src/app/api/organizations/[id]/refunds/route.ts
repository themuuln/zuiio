import { NextResponse } from "next/server";
import type { z } from "zod";
import { createRouteHandler } from "@/lib/api-handler";
import { mutationRateLimiter } from "@/lib/rate-limit";
import {
  getRefunds,
  getRefundStats,
  recordRefund,
} from "@/lib/services/refund-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import { recordRefundSchema } from "@/lib/validation/refunds";

function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
    throw new Error(
      `Validation failed: ${details.map((d) => `${d.path}: ${d.message}`).join(", ")}`,
    );
  }
  return result.data;
}

export const GET = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const { searchParams } = new URL(request.url);

    // Handle /refunds/stats endpoint
    if (searchParams.get("action") === "stats") {
      const stats = await getRefundStats(supabase, orgId);
      return NextResponse.json({ data: stats });
    }

    const status = searchParams.get("status") as
      | "pending"
      | "completed"
      | "failed"
      | "cancelled"
      | undefined;
    const limit = searchParams.get("limit")
      ? Number.parseInt(searchParams.get("limit")!, 10)
      : undefined;
    const offset = searchParams.get("offset")
      ? Number.parseInt(searchParams.get("offset")!, 10)
      : undefined;

    const refunds = await getRefunds(supabase, orgId, {
      status,
      limit,
      offset,
    });
    return NextResponse.json({ data: refunds });
  },
  { requiredPermission: { resource: "refunds", action: "read" } },
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
    const params = validate(recordRefundSchema, body);

    const refunds = await recordRefund(supabase, params.invoice_id, orgId, {
      amount: params.amount,
      method: params.method,
      reason: params.reason,
      reference: params.reference,
      notes: params.notes,
    });

    return NextResponse.json({ data: refunds }, { status: 201 });
  },
  { requiredPermission: { resource: "refunds", action: "create" } },
);
