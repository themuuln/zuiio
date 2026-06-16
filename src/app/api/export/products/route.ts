import { toCsv } from "@/lib/csv";
import { requireAppContext } from "@/lib/erp";

export async function GET() {
  const { supabase, organizationId } = await requireAppContext();

  const { data: products } = await supabase
    .from("products")
    .select(
      "id, name, sku, barcode, unit, sale_price, cost_price, current_stock, min_stock, categories(name), brands(name)",
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  const rows = (products ?? []).map((p) => ({
    name: p.name,
    sku: p.sku ?? "",
    barcode: p.barcode ?? "",
    unit: p.unit ?? "",
    sale_price: p.sale_price ?? 0,
    cost_price: p.cost_price ?? 0,
    current_stock: p.current_stock ?? 0,
    min_stock: p.min_stock ?? 0,
    category: (p.categories as { name: string } | null)?.name ?? "",
    brand: (p.brands as { name: string } | null)?.name ?? "",
  }));

  const csv = toCsv(rows, [
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
  ]);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="products-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
