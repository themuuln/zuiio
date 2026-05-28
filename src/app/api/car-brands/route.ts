import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("car_brands")
    .select("id, name, country, is_active")
    .eq("is_active", true)
    .order("name");

  if (error) {
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json(
      { error: { message: "Brand name is required" } },
      { status: 400 },
    );
  }

  // Check for duplicate
  const { data: existing } = await supabase
    .from("car_brands")
    .select("id")
    .ilike("name", name)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ data: existing });
  }

  const { data, error } = await supabase
    .from("car_brands")
    .insert({ name, is_active: true })
    .select("id, name, country, is_active")
    .single();

  if (error) {
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}
