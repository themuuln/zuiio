import { withDbCapture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { requireAppContext } from "@/lib/erp";

export async function GET() {
  try {
    const { supabase, organizationId } = await requireAppContext();
    const { data: settings } = await withDbCapture(
      "loyalty_settings_get",
      supabase
        .from("loyalty_settings")
        .select("*")
        .eq("organization_id", organizationId)
        .single(),
    );
    const { data: rewards } = await withDbCapture(
      "loyalty_rewards_list",
      supabase
        .from("loyalty_rewards")
        .select("*")
        .eq("organization_id", organizationId)
        .order("points_cost"),
    );
    const { data: topCustomers } = await withDbCapture(
      "loyalty_top_customers",
      supabase
        .from("contacts")
        .select("id, full_name, phone, points_balance")
        .eq("organization_id", organizationId)
        .gt("points_balance", 0)
        .order("points_balance", { ascending: false })
        .limit(10),
    );
    return NextResponse.json({
      settings: settings ?? null,
      rewards: rewards ?? [],
      topCustomers: topCustomers ?? [],
    });
  } catch {
    return NextResponse.json(
      { error: "Үнэнч хэрэглэгчийн мэдээлэл авахад алдаа гарлаа." },
      { status: 500 },
    );
  }
}
