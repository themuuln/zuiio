import { LowStockToast } from "@/components/dashboard/low-stock-toast";
import { withDbCapture } from "@zuiio/capture";
import { createClient } from "@/lib/supabase/server";

export async function LowStockWrapper({ orgId }: { orgId: string }) {
  const supabase = await createClient();

  const { count } = await withDbCapture("low_stock_count",
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .lt("current_stock", 1)
      .limit(1)
      .maybeSingle()
  );

  return <LowStockToast count={count ?? 0} />;
}
