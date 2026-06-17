import { requireAppContext } from "@/lib/erp";
import type { ExportFormat } from "@/lib/export";
import { serveEntityExport } from "@/lib/export";

const today = () => new Date().toISOString().slice(0, 10);

export async function GET(request: Request) {
  const { supabase, organizationId } = await requireAppContext();

  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") ?? "csv") as ExportFormat;

  const { data: expenses } = await supabase
    .from("expenses")
    .select("id, category, amount, description, payment_method, expense_date")
    .eq("organization_id", organizationId)
    .order("expense_date", { ascending: false });

  const rows = (expenses ?? []).map((e) => ({
    date: e.expense_date ?? "",
    category: e.category ?? "",
    amount: e.amount ?? 0,
    payment_method: e.payment_method ?? "",
    description: e.description ?? "",
  }));

  const columns = [
    { header: "Огноо", key: "date" },
    { header: "Ангилал", key: "category" },
    { header: "Дүн", key: "amount" },
    { header: "Төлбөрийн хэлбэр", key: "payment_method" },
    { header: "Тайлбар", key: "description" },
  ];

  return serveEntityExport(
    rows,
    columns,
    format,
    `expenses-export-${today()}`,
    "Зарлага",
  );
}
