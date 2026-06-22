import { withBranchFilter } from "@/lib/branches";
import { formatCurrency, formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

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
      return "Цуцлагдсан";
    default:
      return status ?? "-";
  }
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
  const supabase = await createClient();

  const { data: sales } = await withBranchFilter(
    supabase
      .from("sales")
      .select("id, total_amount, sale_date, status, contacts(name)")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(5),
    branchId,
    isBranchScoped,
  );

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-xs">
      <div className="flex items-center justify-between px-6 py-4">
        <h3 className="text-sm font-semibold">Сүүлийн борлуулалтууд</h3>
      </div>
      {!sales?.length ? (
        <div className="px-6 pb-6 pt-2">
          <p className="text-sm text-muted-foreground">
            Борлуулалт бүртгэгдээгүй байна.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-6 py-3 font-medium">Огноо</th>
                <th className="px-6 py-3 font-medium">Харилцагч</th>
                <th className="px-6 py-3 font-medium text-right">Дүн</th>
                <th className="px-6 py-3 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr
                  key={sale.id}
                  className="border-b last:border-0 hover:bg-muted/50"
                >
                  <td className="px-6 py-3 text-muted-foreground">
                    {formatDate(sale.sale_date)}
                  </td>
                  <td className="px-6 py-3">
                    {(sale.contacts as { name: string } | null)?.name ?? "-"}
                  </td>
                  <td className="px-6 py-3 text-right font-medium">
                    {formatCurrency(sale.total_amount)}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(sale.status)}`}
                    >
                      {statusLabel(sale.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
