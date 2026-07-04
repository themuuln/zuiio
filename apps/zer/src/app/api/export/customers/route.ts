import type { ServeExportConfig } from "@/lib/export/serve-export";
import { serveExportRoute } from "@/lib/export/serve-export";

const config: ServeExportConfig = {
  table: "contacts",
  select: "id, name, phone, email, address, balance",
  mapRow: (c) => ({
    name: c.name ?? "",
    phone: c.phone ?? "",
    email: c.email ?? "",
    address: c.address ?? "",
    balance: c.balance ?? 0,
  }),
  columns: [
    { header: "Нэр", key: "name" },
    { header: "Утас", key: "phone" },
    { header: "И-мэйл", key: "email" },
    { header: "Хаяг", key: "address" },
    { header: "Үлдэгдэл", key: "balance" },
  ],
  eq: { type: "customer" },
  order: { column: "created_at" },
  filename: "customers-export",
  title: "Харилцагчид",
};

export async function GET(request: Request) {
  return serveExportRoute(request, config);
}
