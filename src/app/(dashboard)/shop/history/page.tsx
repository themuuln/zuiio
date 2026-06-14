import { ClockCounterClockwise } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { requireAppContext } from "@/lib/erp";

const paymentMethodLabels: Record<string, string> = {
  cash: "Бэлэн",
  card: "Карт",
  bank_transfer: "Данс",
  invoice: "Нэхэмжлэл",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount: number): string {
  return `${amount.toLocaleString()}₮`;
}

function getStatusBadgeClass(status: string | null): string {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "pending":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "cancelled":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
  }
}

function getStatusLabel(status: string | null): string {
  switch (status) {
    case "completed":
      return "Гүйцэтгэсэн";
    case "pending":
      return "Хүлээгдэж буй";
    case "cancelled":
      return "Цуцлагдсан";
    default:
      return status ?? "-";
  }
}

type SaleRow = {
  id: string;
  total_amount: number;
  paid_amount: number | null;
  payment_method: string | null;
  status: string | null;
  sale_date: string;
  created_at: string | null;
  contacts: { name: string } | null;
  profiles: { full_name: string | null } | null;
  item_count: number;
};

type SaleListItem = {
  id: string;
  total_amount: number;
  paid_amount: number | null;
  payment_method: string | null;
  status: string | null;
  sale_date: string;
  created_at: string | null;
  contacts: { name: string } | null;
  salesperson_id: string | null;
  profiles: { full_name: string | null } | null;
};

export default async function HistoryPage() {
  const { supabase, organizationId } = await requireAppContext();

  // Fetch recent sales with contact info and salesperson info
  const { data: sales } = await supabase
    .from("sales")
    .select(
      "id, total_amount, paid_amount, payment_method, status, sale_date, created_at, contact_id, contacts(name), salesperson_id, profiles!sales_salesperson_id_fkey(full_name)",
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!sales || sales.length === 0) {
    return (
      <div className="flex flex-col gap-4 pb-20">
        <h1 className="text-lg font-semibold">Борлуулалтын түүх</h1>
        <Empty className="min-h-[300px] rounded-xl border border-dashed border-border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClockCounterClockwise className="size-6" />
            </EmptyMedia>
            <EmptyTitle>Борлуулалт байхгүй</EmptyTitle>
            <EmptyDescription>
              Борлуулалт хийгдсэний дараа энд харагдах болно.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  // Fetch item counts for all sales
  const saleIds = sales.map((s) => s.id);
  const { data: saleItems } = await supabase
    .from("sale_items")
    .select("sale_id")
    .in("sale_id", saleIds);

  // Count items per sale
  const itemCountMap = new Map<string, number>();
  for (const item of saleItems ?? []) {
    itemCountMap.set(item.sale_id, (itemCountMap.get(item.sale_id) ?? 0) + 1);
  }

  // Combine sales with item counts
  const salesWithCounts: SaleRow[] = (sales as SaleListItem[]).map((sale) => ({
    ...sale,
    item_count: itemCountMap.get(sale.id) ?? 0,
  }));

  return (
    <div className="flex flex-col gap-4 pb-20">
      <h1 className="text-lg font-semibold">Борлуулалтын түүх</h1>

      <div className="flex flex-col gap-2">
        {salesWithCounts.map((sale) => {
          const paymentLabel =
            paymentMethodLabels[sale.payment_method ?? ""] ??
            sale.payment_method ??
            "-";

          return (
            <Link
              key={sale.id}
              href={`/shop/history/${sale.id}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/50 active:bg-muted"
            >
              {/* Left: date and ID */}
              <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                <span className="text-sm font-medium truncate">
                  {formatDate(sale.created_at ?? sale.sale_date)}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  #{sale.id.slice(0, 8).toUpperCase()}
                  {sale.contacts?.name && ` · ${sale.contacts.name}`}
                  {sale.profiles?.full_name &&
                    ` · 🧑 ${sale.profiles.full_name}`}
                </span>
              </div>

              {/* Right: amount, item count, status */}
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-sm font-semibold tabular-nums">
                  {formatCurrency(Number(sale.total_amount))}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">
                    {sale.item_count} зүйл
                  </span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">
                    {paymentLabel}
                  </span>
                </div>
                <span
                  className={`mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium leading-none ${getStatusBadgeClass(sale.status)}`}
                >
                  {getStatusLabel(sale.status)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
