import type { ServeExportConfig } from "@/lib/export/serve-export";
import { serveExportRoute } from "@/lib/export/serve-export";

const config: ServeExportConfig = {
  table: "sales",
  select:
    "id, total_amount, paid_amount, sale_date, status, payment_method, contacts(name)",
  mapRow: (s) => ({
    date: s.sale_date ?? "",
    contact: (s.contacts as { name: string } | null)?.name ?? "",
    total_amount: s.total_amount ?? 0,
    paid_amount: s.paid_amount ?? 0,
    status: s.status ?? "",
    payment_method: s.payment_method ?? "",
  }),
  columns: [
    { header: "Огноо", key: "date" },
    { header: "Харилцагч", key: "contact" },
    { header: "Нийт дүн", key: "total_amount" },
    { header: "Төлсөн дүн", key: "paid_amount" },
    { header: "Төлөв", key: "status" },
    { header: "Төлбөрийн хэлбэр", key: "payment_method" },
  ],
  order: { column: "sale_date" },
  title: "Борлуулалт",
};

export async function GET(request: Request) {
  return serveExportRoute(request, config);
}
