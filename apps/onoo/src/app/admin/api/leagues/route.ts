import * as Sentry from "@sentry/nextjs";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_ORG_ID = "b0000000-0000-0000-0000-000000000001";

export async function GET(_request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("leagues")
    .select("*, sports(name_en, name_mn)");

  if (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
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
  const { name, slug, sport_id, organization_id } = body;

  if (!name || !slug || !sport_id) {
    return NextResponse.json(
      { error: "name, slug, and sport_id are required" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("leagues")
    .insert({
      name,
      slug,
      sport_id,
      organization_id: organization_id ?? DEFAULT_ORG_ID,
    })
    .select("*, sports(name_en, name_mn)")
    .single();

  if (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
