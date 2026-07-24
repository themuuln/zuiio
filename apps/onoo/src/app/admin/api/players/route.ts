import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const search = request.nextUrl.searchParams.get("search");

  let query = supabase.from("players").select("*");

  if (search) {
    const pattern = `%${search}%`;
    query = query.or(`canonical_name.ilike.${pattern},name_latin.ilike.${pattern}`);
  }

  const { data, error } = await query;

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { canonical_name, name_latin, position, nationality, visibility, consent_recorded_at, consent_note } = body;

  if (!canonical_name) {
    return NextResponse.json(
      { error: "canonical_name is required" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("players")
    .insert({
      canonical_name,
      name_latin: name_latin ?? null,
      position: position ?? null,
      nationality: nationality ?? null,
      visibility: visibility ?? "public",
      consent_recorded_at: consent_recorded_at || null,
      consent_note: consent_note ?? null,
    })
    .select("*")
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
