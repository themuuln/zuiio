import type { SupabaseClient } from "@supabase/supabase-js";
import type { Tool } from "@zuiio/ai-agent";
import type { Database } from "@/lib/supabase/types";

interface InventoryItem {
  name: string;
  sku: string | null;
  currentStock: number | null;
  minStock: number | null;
  salePrice: number | null;
  costPrice: number | null;
  unit: string | null;
}

interface LowStockItem {
  name: string;
  currentStock: number;
  minStock: number;
  sku: string | null;
  unit: string | null;
}

export function createInventoryTools(
  supabase: SupabaseClient<Database>,
  orgId: string,
): Tool[] {
  const getInventory: Tool = {
    name: "getInventory",
    description: "Барааны нэрээр хайх. Нөөц, үнэ мэдээллийг буцаана.",
    parameters: [
      {
        name: "query",
        type: "string",
        description: "Хайх нэр",
      },
      {
        name: "limit",
        type: "number",
        description: "Гаргах дээд тоо",
        required: false,
      },
    ],
    execute: async (args: Record<string, unknown>) => {
      const query = (args.query as string) || "";
      const limit = (args.limit as number) || 5;

      let dbQuery = supabase
        .from("products")
        .select(
          "name, sku, current_stock, min_stock, sale_price, cost_price, unit",
        )
        .eq("organization_id", orgId)
        .is("deleted_at", null)
        .order("name");

      if (query) {
        dbQuery = dbQuery.ilike("name", `%${query}%`);
      }

      dbQuery = dbQuery.limit(limit);

      const { data, error } = await dbQuery;

      if (error) {
        throw new Error(`Барааны хайлт амжилтгүй: ${error.message}`);
      }

      const items: InventoryItem[] = (data || []).map((row) => ({
        name: row.name,
        sku: row.sku,
        currentStock: row.current_stock,
        minStock: row.min_stock,
        salePrice: row.sale_price,
        costPrice: row.cost_price,
        unit: row.unit,
      }));

      return {
        items,
        total: items.length,
      };
    },
  };

  const getLowStockItems: Tool = {
    name: "getLowStockItems",
    description:
      "Бага нөөцтэй бараануудыг харуулах (current_stock <= min_stock).",
    parameters: [],
    execute: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("name, current_stock, min_stock, sku, unit")
        .eq("organization_id", orgId)
        .is("deleted_at", null)
        .not("current_stock", "is", null)
        .not("min_stock", "is", null);

      if (error) {
        throw new Error(`Бага нөөцийн хайлт амжилтгүй: ${error.message}`);
      }

      const rows = (data || []).filter(
        (row) => (row.current_stock as number) <= (row.min_stock as number),
      );

      const items: LowStockItem[] = rows.map((row) => ({
        name: row.name,
        currentStock: row.current_stock as number,
        minStock: row.min_stock as number,
        sku: row.sku,
        unit: row.unit,
      }));

      return {
        items,
        count: items.length,
      };
    },
  };

  return [getInventory, getLowStockItems];
}
