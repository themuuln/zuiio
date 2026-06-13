import { ClockCounterClockwise } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount: number): string {
  return `${amount.toLocaleString()}₮`;
}

type SaleItem = {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_id: string | null;
  products: { name: string; unit: string | null } | null;
};

type SaleDetail = {
  id: string;
  total_amount: number;
  paid_amount: number | null;
  payment_method: string | null;
  status: string | null;
  sale_date: string;
  created_at: string | null;
  contact_id: string | null;
  contacts: { name: string } | null;
};

function SaleDetailContent({
  sale,
  items,
}: {
  sale: SaleDetail;
  items: SaleItem[];
}) {
  const paidAmount = Number(sale.paid_amount ?? 0);
  const totalAmount = Number(sale.total_amount);
  const change = paidAmount > totalAmount ? paidAmount - totalAmount : 0;
  const paymentLabel =
    paymentMethodLabels[sale.payment_method ?? ""] ??
    sale.payment_method ??
    "-";

  return (
    <div className="flex flex-col gap-4 pb-20">
      {/* Back link */}
      <Link
        href="/shop/history"
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        ← Түүх рүү буцах
      </Link>

      {/* Header */}
      <div className="flex flex-col items-center gap-1 border-b border-border pb-4">
        <h1 className="text-lg font-semibold">Борлуулалтын дэлгэрэнгүй</h1>
        <p className="text-xs text-muted-foreground">
          #{(sale.id ?? "").slice(0, 8).toUpperCase()}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDate(sale.created_at ?? sale.sale_date)}
        </p>
      </div>

      {/* Customer name */}
      {sale.contacts?.name && (
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Харилцагч</p>
          <p className="text-sm font-medium">{sale.contacts.name}</p>
        </div>
      )}

      {/* Items */}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground">
          Борлуулалтын мөрүүд
        </p>
        <Card size="sm">
          <CardContent className="flex flex-col gap-2 px-3 py-3">
            {/* Header row */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex-[2]">Бараа</span>
              <span className="w-12 text-right">Тоо</span>
              <span className="w-20 text-right">Үнэ</span>
              <span className="w-20 text-right">Дүн</span>
            </div>
            <div className="border-t border-border" />
            {/* Item rows */}
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                <span className="flex-[2] truncate text-sm font-medium">
                  {item.products?.name ??
                    `Бүтээгдэхүүн #${(item.product_id ?? "").slice(0, 8)}`}
                </span>
                <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">
                  {item.quantity}
                  {item.products?.unit ? ` ${item.products.unit}` : ""}
                </span>
                <span className="w-20 text-right text-xs tabular-nums text-muted-foreground">
                  {formatCurrency(item.unit_price)}
                </span>
                <span className="w-20 text-right text-sm font-semibold tabular-nums">
                  {formatCurrency(item.total_price)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Totals */}
      <div className="rounded-xl border border-border bg-card px-4 py-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Нийт дүн</span>
            <span className="font-semibold tabular-nums">
              {formatCurrency(totalAmount)}
            </span>
          </div>
          <div className="border-t border-border" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Төлбөрийн хэлбэр</span>
            <span className="font-medium">{paymentLabel}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Төлсөн дүн</span>
            <span className="font-medium tabular-nums">
              {formatCurrency(paidAmount)}
            </span>
          </div>
          {change > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Өөрчлөлт</span>
              <span className="font-semibold text-green-600 dark:text-green-400 tabular-nums">
                {formatCurrency(change)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Статус</span>
            <span
              className={`font-medium ${
                sale.status === "completed"
                  ? "text-green-600 dark:text-green-400"
                  : sale.status === "cancelled"
                    ? "text-red-600 dark:text-red-400"
                    : "text-muted-foreground"
              }`}
            >
              {sale.status === "completed"
                ? "Гүйцэтгэсэн"
                : sale.status === "cancelled"
                  ? "Цуцлагдсан"
                  : (sale.status ?? "-")}
            </span>
          </div>
        </div>
      </div>

      {/* Back button */}
      <Button
        variant="outline"
        size="lg"
        className="h-[52px] w-full text-sm"
        render={<Link href="/shop/history" />}
      >
        Түүх рүү буцах
      </Button>
    </div>
  );
}

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, organizationId } = await requireAppContext();

  // Fetch sale with contact info
  const { data: sale } = await supabase
    .from("sales")
    .select(
      "id, total_amount, paid_amount, payment_method, status, sale_date, created_at, contact_id, contacts(name)",
    )
    .eq("organization_id", organizationId)
    .eq("id", id)
    .single();

  // If no sale found, show error state
  if (!sale) {
    return (
      <div className="flex flex-col gap-4 pb-20">
        <Link
          href="/shop/history"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Түүх рүү буцах
        </Link>
        <h1 className="text-lg font-semibold">Борлуулалтын дэлгэрэнгүй</h1>
        <Empty className="min-h-[300px] rounded-xl border border-dashed border-border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClockCounterClockwise className="size-6" />
            </EmptyMedia>
            <EmptyTitle>Борлуулалт олдсонгүй</EmptyTitle>
            <EmptyDescription>
              Энэ борлуулалт олдсонгүй эсвэл устгагдсан байна.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  // Fetch sale items with product info
  const { data: items } = await supabase
    .from("sale_items")
    .select(
      "id, quantity, unit_price, total_price, product_id, products(name, unit)",
    )
    .eq("sale_id", id)
    .order("id", { ascending: true });

  return (
    <SaleDetailContent
      sale={sale as unknown as SaleDetail}
      items={(items ?? []) as SaleItem[]}
    />
  );
}
