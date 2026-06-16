import { notFound } from "next/navigation";
import { PageShell } from "@/components/erp/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAppContext } from "@/lib/erp";
import { formatCurrency, formatDate } from "@/lib/format";

const paymentMethodLabels: Record<string, string> = {
  cash: "Бэлэн",
  card: "Карт",
  bank_transfer: "Данс",
  invoice: "Нэхэмжлэл",
};

function StatusBadge({ status }: { status: string | null }) {
  switch (status) {
    case "completed":
      return (
        <Badge className="bg-green-600 hover:bg-green-700 dark:bg-green-500">
          Дууссан
        </Badge>
      );
    case "pending":
      return (
        <Badge
          variant="secondary"
          className="bg-yellow-500 hover:bg-yellow-600 text-white"
        >
          Хүлээгдэж буй
        </Badge>
      );
    case "cancelled":
      return <Badge variant="destructive">Цуцлагдсан</Badge>;
    default:
      return <Badge variant="outline">{status ?? "-"}</Badge>;
  }
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
      "id, total_amount, paid_amount, sale_date, status, payment_method, contacts(name)",
    )
    .eq("organization_id", organizationId)
    .eq("id", id)
    .single();

  if (!sale) {
    notFound();
  }

  // Fetch sale items with product info
  const { data: items } = await supabase
    .from("sale_items")
    .select(
      "id, quantity, unit_price, total_price, product_id, products(name, unit)",
    )
    .eq("sale_id", id)
    .order("id", { ascending: true });

  const contactName = (sale.contacts as { name: string } | null)?.name ?? null;

  return (
    <PageShell
      title="Борлуулалтын дэлгэрэнгүй"
      description={`#${sale.id.slice(0, 8).toUpperCase()} · ${formatDate(sale.sale_date)}`}
    >
      {/* Sale header info */}
      <Card>
        <CardHeader>
          <CardTitle>Борлуулалтын мэдээлэл</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Огноо</p>
              <p className="font-medium">{formatDate(sale.sale_date)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Харилцагч</p>
              <p className="font-medium">{contactName ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Статус</p>
              <StatusBadge status={sale.status} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Төлбөрийн арга</p>
              <p className="font-medium">
                {paymentMethodLabels[sale.payment_method ?? ""] ??
                  sale.payment_method ??
                  "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Төлсөн дүн</p>
              <p className="font-medium">
                {formatCurrency(Number(sale.paid_amount ?? 0))}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Нийт дүн</p>
              <p className="text-lg font-bold">
                {formatCurrency(Number(sale.total_amount))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line items table */}
      <Card>
        <CardHeader>
          <CardTitle>Борлуулалтын мөрүүд</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="pb-2 font-medium whitespace-nowrap">Бараа</th>
                <th className="pb-2 text-right font-medium whitespace-nowrap">
                  Тоо хэмжээ
                </th>
                <th className="pb-2 text-right font-medium whitespace-nowrap">
                  Нэгж үнэ
                </th>
                <th className="pb-2 text-right font-medium whitespace-nowrap">
                  Нийт үнэ
                </th>
              </tr>
            </thead>
            <tbody>
              {(items ?? []).map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-3 font-medium whitespace-nowrap">
                    {item.products?.name ??
                      `Бүтээгдэхүүн #${(item.product_id ?? "").slice(0, 8)}`}
                  </td>
                  <td className="py-3 text-right tabular-nums whitespace-nowrap">
                    {item.quantity}
                    {item.products?.unit ? ` ${item.products.unit}` : ""}
                  </td>
                  <td className="py-3 text-right tabular-nums text-muted-foreground whitespace-nowrap">
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td className="py-3 text-right font-semibold tabular-nums whitespace-nowrap">
                    {formatCurrency(item.total_price)}
                  </td>
                </tr>
              ))}
              {(items ?? []).length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="py-6 text-center text-sm text-muted-foreground"
                  >
                    Борлуулалтын мөрүүд олдсонгүй
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </PageShell>
  );
}
