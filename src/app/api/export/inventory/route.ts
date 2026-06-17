import { requireAppContext } from "@/lib/erp";
import type { ExportFormat } from "@/lib/export";
import { serveEntityExport } from "@/lib/export";

const today = () => new Date().toISOString().slice(0, 10);

export async function GET(request: Request) {
  const { supabase, organizationId } = await requireAppContext();

  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") ?? "csv") as ExportFormat;

  const { data: products } = await supabase
    .from("products")
    .select(
      "id, name, sku, unit, cost_price, current_stock, min_stock, categories(name), brands(name)",
    )
    .eq("organization_id", organizationId)
    .order("name", { ascending: true });

  const rows = (products ?? []).map((p) => {
    const currentStock = p.current_stock ?? 0;
    const minStock = p.min_stock ?? 0;
    return {
      name: p.name ?? "",
      sku: p.sku ?? "",
      unit: p.unit ?? "",
      cost_price: p.cost_price ?? 0,
      current_stock: currentStock,
      min_stock: minStock,
      stock_value: (p.cost_price ?? 0) * currentStock,
      low_stock: currentStock < minStock ? "Тийм" : "Үгүй",
      category: (p.categories as { name: string } | null)?.name ?? "",
      brand: (p.brands as { name: string } | null)?.name ?? "",
    };
  });

  const columns = [
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
  ];

  return serveEntityExport(
    rows,
    columns,
    format,
    `inventory-export-${today()}`,
    "Агуулахын үлдэгдэл",
  );
}
