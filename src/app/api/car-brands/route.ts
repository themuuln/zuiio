import { NextResponse } from "next/server";
import { createSimpleRouteHandler } from "@/lib/api-handler";

export const GET = createSimpleRouteHandler(async ({ supabase }) => {
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
});

export const POST = createSimpleRouteHandler(async ({ request, supabase }) => {
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
});
