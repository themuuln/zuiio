import { withDbCapture } from "@zuiio/capture";
import { cacheLife, cacheTag } from "next/cache";
import { withBranchFilter } from "@/lib/branches";
import { formatCurrency, formatDate } from "@/lib/format";
import { createServiceClient } from "@/lib/supabase/server-service";

function statusBadgeClass(status: string | null): string {
  switch (status) {
    case "completed":
      return "bg-primary/10 text-primary";
    case "pending":
      return "bg-secondary text-secondary-foreground";
    case "cancelled":
      return "bg-destructive/10 text-destructive";
    default:
      return "border text-muted-foreground";
  }
}

function statusLabel(status: string | null): string {
  switch (status) {
    case "completed":
      return "Дууссан";
    case "pending":
      return "Хүлээгдэж буй";
    case "cancelled":
      return "Цуцалсан";
    default:
      return status ?? "—";
  }
}

type SaleRow = {
  id: string;
  total_amount: number | null;
  sale_date: string;
  status: string | null;
  contacts: { name: string } | null;
};

async function getRecentSales(
  organizationId: string,
  branchId: string | null,
  isBranchScoped: boolean,
): Promise<SaleRow[]> {
  "use cache";
  cacheLife("frequent");
  cacheTag(`sales:${organizationId}`);

  // ⚠️ SERVICE ROLE — no RLS. Every query MUST filter by organizationId.
  const supabase = createServiceClient();

  const { data } = await withDbCapture(
    "dashboard_recent_sales",
    withBranchFilter(
      supabase
        .from("sales")
        .select("id, total_amount, sale_date, status, contacts(name)")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(5),
      branchId,
      isBranchScoped,
    ),
  );

  return (data as SaleRow[]) ?? [];
}

export async function RecentSales({
  orgId,
  branchId,
  isBranchScoped,
}: {
  orgId: string;
  branchId: string | null;
  isBranchScoped: boolean;
}) {
  const sales = await getRecentSales(orgId, branchId, isBranchScoped);

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-xs">
      <div className="flex items-center justify-between p-6 pb-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          Сүүлийн борлуулалт
        </h2>
      </div>
      <div className="p-6 pt-0">
        {sales.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Борлуулалт байхгүй байна.
          </p>
        ) : (
          <div className="space-y-3">
            {sales.map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">
                    {sale.contacts?.name ?? "Нэр байхгүй"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(sale.sale_date)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(sale.status)}`}
                  >
                    {statusLabel(sale.status)}
                  </span>
                  <span className="text-sm font-medium">
                    {formatCurrency(sale.total_amount ?? 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
