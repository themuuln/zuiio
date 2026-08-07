import { type NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/supabase/admin-route";

export async function GET(request: NextRequest) {
  return withAuth<unknown>(async (supabase) => {
    const bundleId = request.nextUrl.searchParams.get("bundle_id");
    if (!bundleId) {
      return NextResponse.json(
        { error: "bundle_id query parameter is required" },
        { status: 400 },
      ) as unknown as NextResponse<unknown>;
    }

    const { data, error } = await supabase
      .from("bundle_items")
      .select("product_id")
      .eq("bundle_id", bundleId);

    if (error) throw error;
    return NextResponse.json(data as never);
  });
}

export async function POST(request: NextRequest) {
  return withAuth<unknown>(async (supabase) => {
    const body = await request.json();
    const { bundle_id, product_ids } = body;

    if (!bundle_id) {
      return NextResponse.json(
        { error: "bundle_id is required" },
        { status: 400 },
      ) as unknown as NextResponse<unknown>;
    }
    if (!Array.isArray(product_ids)) {
      return NextResponse.json(
        { error: "product_ids must be an array" },
        { status: 400 },
      ) as unknown as NextResponse<unknown>;
    }

    // Delete existing items and insert new ones
    const { error: deleteError } = await supabase
      .from("bundle_items")
      .delete()
      .eq("bundle_id", bundle_id);

    if (deleteError) throw deleteError;

    if (product_ids.length > 0) {
      const items = product_ids.map((product_id: string) => ({
        bundle_id,
        product_id,
      }));
      const { error: insertError } = await supabase
        .from("bundle_items")
        .insert(items);

      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true } as never);
  });
}
