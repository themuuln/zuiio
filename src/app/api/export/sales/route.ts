import { toCsv } from "@/lib/csv";
import { requireAppContext } from "@/lib/erp";

export async function GET() {
  const { supabase, organizationId } = await requireAppContext();

  const { data: sales } = await supabase
    .from("sales")
    .select(
      "id, total_amount, paid_amount, sale_date, status, payment_method, contacts(name)",
    )
    .eq("organization_id", organizationId)
    .order("sale_date", { ascending: false });

  const rows = (sales ?? []).map((s) => ({
    date: s.sale_date ?? "",
    contact: (s.contacts as { name: string } | null)?.name ?? "",
    total_amount: s.total_amount ?? 0,
    paid_amount: s.paid_amount ?? 0,
    status: s.status ?? "",
    payment_method: s.payment_method ?? "",
  }));

  const csv = toCsv(rows, [
    { header: "Огноо", key: "date" },
    { header: "Харилцагч", key: "contact" },
    { header: "Нийт дүн", key: "total_amount" },
    { header: "Төлсөн дүн", key: "paid_amount" },
    { header: "Төлөв", key: "status" },
    { header: "Төлбөрийн хэлбэр", key: "payment_method" },
  ]);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sales-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
