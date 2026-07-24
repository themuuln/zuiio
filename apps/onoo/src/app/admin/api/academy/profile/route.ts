import { type NextRequest, NextResponse } from "next/server";
import { createRouteHandlers, withAuth } from "@/lib/supabase/admin-route";

const profile = createRouteHandlers("academy_profiles");

export const GET = profile.list();

/**
 * POST /admin/api/academy/profile
 * With action=seed, creates a default academy profile for the first organization.
 */
export async function POST(request: NextRequest) {
  return withAuth(async (supabase) => {
    const body = await request.json();
    if (body.action !== "seed") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Check if a profile already exists
    const { data: existing } = await supabase
      .from("academy_profiles")
      .select("id")
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "Academy profile already exists" },
        { status: 409 },
      );
    }

    // Find the first organization to associate the profile with
    const { data: orgs } = await supabase
      .from("organizations")
      .select("id")
      .limit(1);

    const organizationId = orgs?.[0]?.id;
    if (!organizationId) {
      return NextResponse.json(
        { error: "No organization found to associate profile with" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("academy_profiles")
      .insert({
        organization_id: organizationId,
        name: body.name ?? "Академи",
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  });
}
