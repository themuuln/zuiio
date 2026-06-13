import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";
import { mutationRateLimiter } from "@/lib/rate-limit";
import { recordPayment } from "@/lib/services/invoice-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";

export const POST = createRouteHandler(
  async ({ request, orgId, params, supabase }) => {
    await requireActiveSubscription(orgId);
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const rateCheck = await mutationRateLimiter.check(ip);
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
    const { invoiceId } = params;
    const body = await request.json();

    if (!body.amount || Number(body.amount) <= 0) {
      throw new ValidationError("A valid positive amount is required");
    }

    const payments = await recordPayment(supabase, invoiceId, orgId, {
      amount: Number(body.amount),
      method: body.method ?? "cash",
      reference: body.reference ?? undefined,
      notes: body.notes ?? undefined,
    });

    return NextResponse.json({ data: payments }, { status: 201 });
  },
);
