import { type NextRequest, NextResponse } from "next/server";
import { createRouteHandlers, withAuth } from "@/lib/supabase/admin-route";

// ── Custom GET with search ────────────────────────────────────
// Players use ilike search on canonical_name and name_latin,
// which doesn't fit the simple eq filter pattern.
export async function GET(request: NextRequest) {
  return withAuth<unknown>(async (supabase) => {
    const search = request.nextUrl.searchParams.get("search");
    let query = supabase.from("players").select("*");
    if (search) {
      const pattern = `%${search}%`;
      query = query.or(
        `canonical_name.ilike.${pattern},name_latin.ilike.${pattern}`,
      );
    }
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data);
  });
}

// ── Standard CRUD for create/update/delete ────────────────────

const players = createRouteHandlers("players", { select: "*" });

export const POST = players.create((body) => {
  const {
    canonical_name,
    name_latin,
    position,
    nationality,
    visibility,
    consent_recorded_at,
    consent_note,
  } = body;
  if (!canonical_name) {
    return { insert: body, validate: "canonical_name is required" };
  }
  return {
    canonical_name,
    name_latin: name_latin ?? null,
    position: position ?? null,
    nationality: nationality ?? null,
    visibility: visibility ?? "public",
    consent_recorded_at: consent_recorded_at || null,
    consent_note: consent_note ?? null,
  };
});
