import { withDbCapture } from "@zuiio/capture";
import { redirect } from "next/navigation";
import { requireAppContext } from "@/lib/erp";
import { checkOrgSetting } from "@/lib/org-settings";
import { TransfersContent } from "./transfers-content";

export interface TransferRow {
  id: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  status: "pending" | "completed" | "cancelled";
  notes: string | null;
  created_at: string | null;
  completed_at: string | null;
}

export interface WarehouseOption {
  id: string;
  name: string;
  location: string | null;
}

export interface ProductOption {
  id: string;
  name: string;
  sku: string | null;
  unit: string | null;
}

export default async function InventoryTransfersPage() {
  const { supabase, organizationId } = await requireAppContext();
  if (!(await checkOrgSetting(supabase, organizationId, "has_inventory")))
    redirect("/");

  const [transfersResult, warehousesResult, productsResult, stockResult] =
    await Promise.all([
      withDbCapture(
        "page:transfers",
        supabase
          .from("stock_transfers" as never)
          .select(
            "id, from_warehouse_id, to_warehouse_id, status, notes, created_at, completed_at",
          )
          .eq("organization_id" as never, organizationId)
          .order("created_at" as never, { ascending: false })
          .limit(100),
      ),
      withDbCapture(
        "page:transfers:warehouses",
        supabase
          .from("warehouses")
          .select("id, name, location")
          .eq("organization_id", organizationId)
          .order("name", { ascending: true }),
      ),
      withDbCapture(
        "page:transfers:products",
        supabase
          .from("products")
          .select("id, name, sku, unit")
          .eq("organization_id", organizationId)
          .is("deleted_at", null)
          .order("name", { ascending: true }),
      ),
      withDbCapture(
        "page:transfers:warehouse_stock",
        supabase
          .from("warehouse_products")
          .select("warehouse_id, current_stock"),
      ),
    ]);

  const warehouses = (warehousesResult.data ?? []) as WarehouseOption[];

  // Per-warehouse stock totals for the "Агуулахын нөөц" summary cards.
  // RLS scopes warehouse_products to the current org's warehouses.
  const stockTotals: Record<string, number> = {};
  for (const row of stockResult.data ?? []) {
    const warehouseId = row.warehouse_id as string;
    stockTotals[warehouseId] =
      (stockTotals[warehouseId] ?? 0) + Number(row.current_stock ?? 0);
  }

  return (
    <TransfersContent
      transfers={(transfersResult.data ?? []) as TransferRow[]}
      warehouses={warehouses}
      products={(productsResult.data ?? []) as ProductOption[]}
      stockTotals={stockTotals}
    />
  );
}
