import type { SupabaseClient } from "@supabase/supabase-js";
import { withDbCapture } from "@zuiio/capture";
import { NextResponse } from "next/server";
import { requireAppContext } from "@/lib/erp";

export async function GET() {
  try {
    const { supabase, organizationId } = await requireAppContext();
    const db = supabase as unknown as SupabaseClient;
    const { data: budgets, error } = await withDbCapture(
      "budgets_list",
      db
        .from("budgets")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false }),
    );
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ budgets: budgets ?? [] });
  } catch {
    return NextResponse.json(
      { error: "Төсвийн жагсаалт авахад алдаа гарлаа." },
      { status: 500 },
    );
  }
}
