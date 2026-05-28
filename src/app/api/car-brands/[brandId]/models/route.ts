import { NextResponse, type NextRequest } from "next/server";
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
