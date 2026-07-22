import type { z } from "zod";
import { createRouteHandler } from "@/lib/api-handler";
import { created, ok } from "@/lib/api-response";
import {
  getRefundStats,
  getRefunds,
  recordRefund,
} from "@/lib/services/refund-service";
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
      return ok(stats);
    }

    const status = searchParams.get("status") as
      | "pending"
      | "completed"
      | "failed"
      | "cancelled"
      | undefined;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Number.parseInt(limitParam, 10) : 20;
    const offsetParam = searchParams.get("offset");
    const offset = offsetParam ? Number.parseInt(offsetParam, 10) : 0;

    const refunds = await getRefunds(supabase, orgId, {
      status,
      limit,
      offset,
    });
    return ok(refunds);
  },
  { requiredPermission: { resource: "refunds", action: "read" } },
);

export const POST = createRouteHandler(
  async ({ request, orgId, supabase }) => {
    const body = await request.json();
    const params = validate(recordRefundSchema, body);

    const refunds = await recordRefund(supabase, params.invoice_id, orgId, {
      amount: params.amount,
      method: params.method,
      reason: params.reason,
      reference: params.reference,
      notes: params.notes,
    });

    return created(refunds);
  },
  {
    rateLimit: true,
    subscription: true,
    requiredPermission: { resource: "refunds", action: "create" },
  },
);
