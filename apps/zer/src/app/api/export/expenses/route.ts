import type { ServeExportConfig } from "@/lib/export/serve-export";
import { serveExportRoute } from "@/lib/export/serve-export";

const config: ServeExportConfig = {
  table: "expenses",
  select: "id, category, amount, description, payment_method, expense_date",
  mapRow: (e) => ({
    date: e.expense_date ?? "",
    category: e.category ?? "",
    amount: e.amount ?? 0,
    payment_method: e.payment_method ?? "",
    description: e.description ?? "",
  }),
  columns: [
    { header: "Огноо", key: "date" },
    { header: "Ангилал", key: "category" },
    { header: "Дүн", key: "amount" },
    { header: "Төлбөрийн хэлбэр", key: "payment_method" },
    { header: "Тайлбар", key: "description" },
  ],
  order: { column: "expense_date" },
  title: "Зарлага",
};

export async function GET(request: Request) {
  return serveExportRoute(request, config);
}
