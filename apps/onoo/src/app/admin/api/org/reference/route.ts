/**
 * GET /admin/api/org/reference — returns organizations in one response
 * Consolidates shared org reference data for all org sub-pages.
 */
import { withAuth } from "@/lib/supabase/admin-route";
import { NextResponse } from "next/server";

interface OrgReference {
  orgs: unknown[];
}

export const GET = () =>
  withAuth<OrgReference>(async (supabase) => {
    const [orgs] = await Promise.all([
      supabase.from("organizations").select("*").order("name"),
    ]);

    if (orgs.error) {
      return NextResponse.json({ error: orgs.error.message }, { status: 500 }) as never;
    }

    return NextResponse.json({
      orgs: (orgs.data ?? []) as unknown as unknown[],
    });
  });
