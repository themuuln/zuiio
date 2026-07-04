import { capture } from "@zuiio/capture";
import type { ServeExportConfig } from "@/lib/export/serve-export";
import { serveExportRoute } from "@/lib/export/serve-export";

const config: ServeExportConfig = {
  table: "products",
  select:
    "id, name, sku, barcode, unit, sale_price, cost_price, current_stock, min_stock, categories(name), brands(name)",
  mapRow: (p) => ({
    name: p.name ?? "",
    sku: p.sku ?? "",
    barcode: p.barcode ?? "",
    unit: p.unit ?? "",
    sale_price: p.sale_price ?? 0,
    cost_price: p.cost_price ?? 0,
    current_stock: p.current_stock ?? 0,
    min_stock: p.min_stock ?? 0,
    category: (p.categories as { name: string } | null)?.name ?? "",
    brand: (p.brands as { name: string } | null)?.name ?? "",
  }),
  columns: [
    { header: "Бүтээгдэхүүн", key: "name" },
    { header: "SKU", key: "sku" },
    { header: "Баркод", key: "barcode" },
    { header: "Хэмжих нэгж", key: "unit" },
    { header: "Брэнд", key: "brand" },
    { header: "Борлуулалтын үнэ", key: "sale_price" },
    { header: "Өртөг", key: "cost_price" },
    { header: "Одоогийн нөөц", key: "current_stock" },
    { header: "Минимум нөөц", key: "min_stock" },
    { header: "Ангилал", key: "category" },
  ],
  isNull: ["deleted_at"],
  order: { column: "created_at" },
  title: "Бүтээгдэхүүн",
};

export async function GET(request: Request) {
  return serveExportRoute(request, config);
}
