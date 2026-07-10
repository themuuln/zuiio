import { withBranchFilter } from "@/lib/branches";
import { requireAppContext } from "@/lib/erp";
import { withDbCapture } from "@zuiio/capture";
import { Suspense } from "react";
import { PageShell } from "@/components/erp/page-shell";
import { PurchasesContent } from "./purchases-content";
import type { PurchaseRow } from "./purchases-table";

function PageSkeleton() {
  return (
    <PageShell
      title="Худалдан авалт"
      description="Нийлүүлэгчээс бараа материалын худалдан авалтын захиалга"
    >
      <div className="h-96 animate-pulse rounded-xl bg-muted" />
    </PageShell>
  );
}

async function DataFetcher({
  searchParams,
}: {
  searchParams: { branch?: string };
}) {
  const urlBranch = searchParams.branch;
  const { supabase, organizationId, branchId, isBranchScoped } =
    await requireAppContext();

  const [ordersResult, suppliersResult, productsResult] = await Promise.all([
    withDbCapture("page:purchases",
      withBranchFilter(
        supabase
          .from("purchase_orders")
          .select(
            "id, order_number, order_date, expected_date, status, total_amount, notes, created_at, contacts!purchase_orders_supplier_id_fkey(name), profiles!purchase_orders_created_by_fkey(full_name)",
          )
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false }),
        branchId,
        isBranchScoped,
        urlBranch,
      )
    ),
    withDbCapture("page:purchases",
      supabase
        .from("contacts")
        .select("id, name, phone")
        .eq("organization_id", organizationId)
        .eq("type", "supplier")
        .order("name"),
    ),
    withDbCapture("page:purchases",
      supabase
        .from("products")
        .select("id, name, cost_price, sale_price, current_stock, unit")
        .eq("organization_id", organizationId)
        .is("deleted_at", null)
        .order("name"),
    ),
  ]);

  const purchaseOrders: PurchaseRow[] =
    (ordersResult.data ?? []).map((order) => ({
      id: order.id,
      order_number: order.order_number,
      order_date: order.order_date,
      expected_date: order.expected_date,
      status: order.status,
      total_amount: order.total_amount,
      notes: order.notes,
      created_at: order.created_at,
      supplier_name: (order.contacts as { name: string } | null)?.name ?? null,
      created_by_name:
        (order.profiles as { full_name: string } | null)?.full_name ?? null,
    })) ?? [];

  return (
    <PurchasesContent
      purchaseOrders={purchaseOrders}
      suppliers={suppliersResult.data ?? []}
      products={productsResult.data ?? []}
    />
  );
}

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const sp = await searchParams;
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DataFetcher searchParams={sp} />
    </Suspense>
  );
}
