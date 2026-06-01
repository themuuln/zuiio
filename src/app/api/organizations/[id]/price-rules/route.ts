import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import {
  createPriceRule,
  deletePriceRule,
  getPriceRule,
  getPriceRules,
  resolvePrice,
  updatePriceRule,
} from "@/lib/services/price-rules-service";

// ── GET /api/organizations/[id]/price-rules ──────────────────
// List all price rules for the organization
export const GET = createRouteHandler(async ({ supabase, orgId, request }) => {
  const url = new URL(request.url);
  const ruleId = url.searchParams.get("id");

  if (ruleId) {
    const rule = await getPriceRule(ruleId);
    return NextResponse.json({ data: rule });
  }

  const rules = await getPriceRules(orgId);
  return NextResponse.json({ data: rules });
});

// ── POST /api/organizations/[id]/price-rules ─────────────────
export const POST = createRouteHandler(
  async ({ supabase, orgId, request, user }) => {
    const body = await request.json();

    if (body.action === "resolve") {
      // Price resolution endpoint
      const result = await resolvePrice(orgId, body.input);
      return NextResponse.json({ data: result });
    }

    // Create rule
    const rule = await createPriceRule(orgId, body, user?.id ?? null);
    return NextResponse.json({ data: rule }, { status: 201 });
  },
);

// ── PATCH /api/organizations/[id]/price-rules?id=xxx ─────────
export const PATCH = createRouteHandler(
  async ({ supabase, orgId, request, user }) => {
    const url = new URL(request.url);
    const ruleId = url.searchParams.get("id");
    if (!ruleId) {
      return NextResponse.json({ error: "Missing rule id" }, { status: 400 });
    }

    const body = await request.json();
    const rule = await updatePriceRule(ruleId, orgId, body, user?.id ?? null);
    return NextResponse.json({ data: rule });
  },
);

// ── DELETE /api/organizations/[id]/price-rules?id=xxx ────────
export const DELETE = createRouteHandler(
  async ({ supabase, orgId, request }) => {
    const url = new URL(request.url);
    const ruleId = url.searchParams.get("id");
    if (!ruleId) {
      return NextResponse.json({ error: "Missing rule id" }, { status: 400 });
    }

    await deletePriceRule(ruleId, orgId);
    return NextResponse.json({ success: true });
  },
);
