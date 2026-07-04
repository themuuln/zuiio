import { NextResponse } from "next/server";
import { ok, created } from "@/lib/api-response";
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
    const rule = await getPriceRule(supabase, ruleId);
    return ok(rule);
  }

  const rules = await getPriceRules(supabase, orgId);
  return ok(rules);
});

// ── POST /api/organizations/[id]/price-rules ─────────────────
export const POST = createRouteHandler(
  async ({ supabase, orgId, request, user }) => {
    const body = await request.json();

    if (body.action === "resolve") {
      // Price resolution endpoint
      const result = await resolvePrice(supabase, orgId, body.input);
      return ok(result);
    }

    // Create rule
    const rule = await createPriceRule(supabase, orgId, body, user?.id ?? null);
    return created(rule);
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
    const rule = await updatePriceRule(
      supabase,
      ruleId,
      orgId,
      body,
      user?.id ?? null,
    );
    return ok(rule);
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

    await deletePriceRule(supabase, ruleId, orgId);
    return NextResponse.json({ success: true });
  },
);
