/**
 * GET /admin/api/org — list organizations
 * POST /admin/api/org — update org profile (uses cmd_update_organization)
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createRouteHandlers, withAuth } from "@/lib/supabase/admin-route";

const orgs = createRouteHandlers("organizations", {
  select:
    "id, name, slug, logo_url, type, contact_phone, contact_email, website, settings, created_at",
});

export const GET = orgs.list();

/**
 * POST /admin/api/org
 * Body: { id, name?, slug?, logo_url?, contact_phone?, contact_email?, website?, settings? }
 */
export async function POST(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();
    const {
      id,
      name,
      slug,
      logo_url,
      contact_phone,
      contact_email,
      website,
      settings,
      social_links,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { data, error } = await supabase.rpc("cmd_update_organization", {
      p_org_id: id,
      p_name: name ?? null,
      p_slug: slug ?? null,
      p_logo_url: logo_url ?? null,
      p_contact_phone: contact_phone ?? null,
      p_contact_email: contact_email ?? null,
      p_website: website ?? null,
      p_settings: settings ?? null,
      p_social_links: social_links ?? null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  });
}
