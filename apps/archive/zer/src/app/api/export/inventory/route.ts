import type { ServeExportConfig } from "@/lib/export/serve-export";
import { serveExportRoute } from "@/lib/export/serve-export";

const config: ServeExportConfig = {
  table: "products",
  select:
    "id, name, sku, unit, cost_price, current_stock, min_stock, categories(name), brands(name)",
  mapRow: (p) => {
    const currentStock = (p.current_stock as number) ?? 0;
    const minStock = (p.min_stock as number) ?? 0;
    return {
      name: p.name ?? "",
      sku: p.sku ?? "",
      unit: p.unit ?? "",
      cost_price: p.cost_price ?? 0,
      current_stock: currentStock,
      min_stock: minStock,
      stock_value: ((p.cost_price as number) ?? 0) * currentStock,
      low_stock: currentStock < minStock ? "Тийм" : "Үгүй",
      category: (p.categories as { name: string } | null)?.name ?? "",
      brand: (p.brands as { name: string } | null)?.name ?? "",
    };
  },
  columns: [
    { header: "Бүтээгдэхүүн", key: "name" },
    { header: "SKU", key: "sku" },
    { header: "Хэмжих нэгж", key: "unit" },
    { header: "Брэнд", key: "brand" },
    { header: "Өртөг", key: "cost_price" },
    { header: "Одоогийн нөөц", key: "current_stock" },
    { header: "Минимум нөөц", key: "min_stock" },
    { header: "Нөөцийн үнэ цэнэ", key: "stock_value" },
    { header: "Бага нөөцтэй эсэх", key: "low_stock" },
    { header: "Ангилал", key: "category" },
  ],
  isNull: ["deleted_at"],
  order: { column: "name", ascending: true },
  filename: "inventory-export",
  title: "Агуулахын үлдэгдэл",
};

export async function GET(request: Request) {
  return serveExportRoute(request, config);
}
