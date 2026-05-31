import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> },
) {
  const { brandId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("car_models")
    .select(
      "id, name, body_type, fuel_type, transmission, drivetrain, year_start, year_end, engine_options, is_active",
    )
    .eq("brand_id", brandId)
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> },
) {
  const { brandId } = await params;
  const supabase = await createClient();
  const body = await request.json();
  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json(
      { error: { message: "Model name is required" } },
      { status: 400 },
    );
  }

  // Check for duplicate
  const { data: existing } = await supabase
    .from("car_models")
    .select("id")
    .eq("brand_id", brandId)
    .ilike("name", name)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ data: existing });
  }

  const { data, error } = await supabase
    .from("car_models")
    .insert({
      brand_id: brandId,
      name,
      is_active: true,
    })
    .select(
      "id, name, body_type, fuel_type, transmission, drivetrain, year_start, year_end, engine_options, is_active",
    )
    .single();

  if (error) {
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}
