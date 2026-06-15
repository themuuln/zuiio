import { toCsv } from "@/lib/csv";
import { requireAppContext } from "@/lib/erp";

export async function GET() {
  const { supabase, organizationId } = await requireAppContext();

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

  const csv = toCsv(rows, [
    { header: "Огноо", key: "date" },
    { header: "Ангилал", key: "category" },
    { header: "Дүн", key: "amount" },
    { header: "Төлбөрийн хэлбэр", key: "payment_method" },
    { header: "Тайлбар", key: "description" },
  ]);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="expenses-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
