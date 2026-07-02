import { requireAppContext } from "@/lib/erp";
import type { ExportFormat } from "@/lib/export";
import { serveEntityExport } from "@/lib/export";

const today = () => new Date().toISOString().slice(0, 10);

export async function GET(request: Request) {
  const { supabase, organizationId } = await requireAppContext();

  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") ?? "csv") as ExportFormat;

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

  const columns = [
    { header: "Огноо", key: "date" },
    { header: "Харилцагч", key: "contact" },
    { header: "Нийт дүн", key: "total_amount" },
    { header: "Төлсөн дүн", key: "paid_amount" },
    { header: "Төлөв", key: "status" },
    { header: "Төлбөрийн хэлбэр", key: "payment_method" },
  ];

  return serveEntityExport(
    rows,
    columns,
    format,
    `sales-export-${today()}`,
    "Борлуулалт",
  );
}
