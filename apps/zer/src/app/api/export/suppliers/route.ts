import type { ServeExportConfig } from "@/lib/export/serve-export";
import { serveExportRoute } from "@/lib/export/serve-export";

const config: ServeExportConfig = {
  table: "contacts",
  select: "id, name, phone, email, address, balance",
  mapRow: (s) => ({
    name: s.name ?? "",
    phone: s.phone ?? "",
    email: s.email ?? "",
    address: s.address ?? "",
    balance: s.balance ?? 0,
  }),
  columns: [
    { header: "Нэр", key: "name" },
    { header: "Утас", key: "phone" },
    { header: "И-мэйл", key: "email" },
    { header: "Хаяг", key: "address" },
    { header: "Үлдэгдэл", key: "balance" },
  ],
  eq: { type: "supplier" },
  order: { column: "created_at" },
  filename: "suppliers-export",
  title: "Нийлүүлэгчид",
};

export async function GET(request: Request) {
  return serveExportRoute(request, config);
}
