import { Receipt } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { NewSaleButton } from "@/components/shop/new-sale-button";
import { ReceiptPrintButton } from "@/components/shop/receipt-print-button";
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

type SaleData = {
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

type ReceiptContentProps = {
  sale: SaleData;
  items: SaleItem[];
  organizationName: string;
};

function ReceiptContent({
  sale,
  items,
  organizationName,
}: ReceiptContentProps) {
  const paidAmount = Number(sale.paid_amount ?? 0);
  const totalAmount = Number(sale.total_amount);
  const change = paidAmount > totalAmount ? paidAmount - totalAmount : 0;
  const paymentLabel =
    paymentMethodLabels[sale.payment_method ?? ""] ??
    sale.payment_method ??
    "-";

  return (
    <div className="flex flex-col gap-4 pb-20 print-content">
      {/* Print styles */}
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }

          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Hide shop layout header */
          header.sticky {
            display: none !important;
          }

          /* Hide bottom navigation bar */
          nav.fixed {
            display: none !important;
          }

          /* Hide elements with no-print class */
          .no-print {
            display: none !important;
          }

          /* Reset main content for print */
          main {
            max-width: 80mm !important;
            padding: 4mm !important;
            margin: 0 auto !important;
          }

          /* Receipt print container */
          .print-content {
            max-width: 80mm !important;
            margin: 0 auto !important;
            padding: 2mm 0 !important;
            background: white !important;
            color: black !important;
            font-size: 10px !important;
            line-height: 1.4 !important;
          }

          .print-content h1 {
            font-size: 14px !important;
            font-weight: 700 !important;
            margin-bottom: 2mm !important;
          }

          .print-content .text-xs,
          .print-content .text-muted-foreground {
            font-size: 8px !important;
            color: #333 !important;
          }

          .print-content .text-sm {
            font-size: 9px !important;
          }

          .print-content .text-lg {
            font-size: 12px !important;
          }

          .print-content .tabular-nums {
            font-variant-numeric: tabular-nums !important;
          }

          /* Remove card borders/shadows in print */
          .print-content .rounded-xl,
          .print-content .border-border {
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            padding: 0 !important;
          }

          /* Item rows need compact spacing */
          .print-content .gap-4 {
            gap: 2mm !important;
          }

          .print-content .gap-2 {
            gap: 1mm !important;
          }

          .print-content .gap-1 {
            gap: 0.5mm !important;
          }

          .print-content .pb-20 {
            padding-bottom: 0 !important;
          }

          .print-content .border-b {
            border-bottom: 1px solid #ccc !important;
          }

          .print-content .border-t {
            border-top: 1px solid #ccc !important;
          }

          .print-content .px-3 {
            padding-left: 0 !important;
            padding-right: 0 !important;
          }

          .print-content .py-3,
          .print-content .px-4,
          .print-content .py-4 {
            padding: 0 !important;
          }

          /* Item list columns */
          .print-content .flex.items-center.gap-2.text-sm {
            font-size: 8px !important;
            gap: 1mm !important;
          }

          /* Divider lines */
          .print-content .border-border {
            border-color: #ccc !important;
          }

          /* Totals section */
          .print-content .gap-1\\.5 {
            gap: 0.5mm !important;
          }

          /* Green text for change/status */
          .print-content [class*="text-green"] {
            color: #333 !important;
          }
        }
      `}</style>

      {/* Header area with print button */}
      <div className="no-print mb-2 flex items-center justify-between gap-2">
        <Link
          href="/shop/history"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Түүх рүү буцах
        </Link>
        <ReceiptPrintButton />
      </div>

      {/* Receipt header */}
      <div className="flex flex-col items-center gap-1 border-b border-border pb-4">
        <h1 className="text-lg font-semibold">{organizationName}</h1>
        <p className="text-xs text-muted-foreground">
          Баримт #{(sale.id ?? "").slice(0, 8).toUpperCase()}
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
            <span className="font-medium text-green-600 dark:text-green-400">
              {sale.status === "completed"
                ? "Гүйцэтгэсэн"
                : (sale.status ?? "-")}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons — hidden during print */}
      <div className="no-print mt-2 flex flex-col gap-2">
        <NewSaleButton />
        <Link
          href="/shop/history"
          className="flex h-[52px] w-full items-center justify-center rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Түүх рүү буцах
        </Link>
      </div>
    </div>
  );
}

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, organizationId } = await requireAppContext();

  // Fetch organization info for store name
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", organizationId)
    .single();

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
        <div className="no-print mb-2 flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">Түүх рүү буцах</p>
        </div>
        <h1 className="text-lg font-semibold">Баримт</h1>
        <Empty className="min-h-[300px] rounded-xl border border-dashed border-border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Receipt className="size-6" />
            </EmptyMedia>
            <EmptyTitle>Баримт олдсонгүй</EmptyTitle>
            <EmptyDescription>
              Энэ баримт олдсонгүй эсвэл устгагдсан байна.
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
    <ReceiptContent
      sale={sale as unknown as SaleData}
      items={(items ?? []) as SaleItem[]}
      organizationName={org?.name ?? "Дэлгүүр"}
    />
  );
}
