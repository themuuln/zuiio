import { requireAppContext } from "@/lib/erp";
import { DiscountsContent } from "./discounts-content";

export type DiscountRow = {
  id: string;
  name: string;
  description: string | null;
  type: "percentage" | "fixed_amount";
  value: number;
  applies_to: "all" | "selected_products" | "selected_categories";
  min_purchase_amount: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  usage_limit: number | null;
  used_count: number;
  created_at: string;
  conditions: Array<{
    condition_type: string;
    condition_value: string;
  }>;
};

export default async function DiscountsPage() {
  const { supabase, organizationId } = await requireAppContext();

  const { data: discounts } = await supabase
    .from("discounts")
    .select(
      "id, name, description, type, value, applies_to, min_purchase_amount, valid_from, valid_until, is_active, usage_limit, used_count, created_at",
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  // Fetch conditions for each discount
  const discountIds = (discounts ?? []).map((d) => d.id);
  let conditionsMap: Record<string, Array<{ condition_type: string; condition_value: string }>> = {};

  if (discountIds.length > 0) {
    const { data: conditions } = await supabase
      .from("discount_conditions")
      .select("discount_id, condition_type, condition_value")
      .in("discount_id", discountIds);

    for (const cond of conditions ?? []) {
      if (!conditionsMap[cond.discount_id]) {
        conditionsMap[cond.discount_id] = [];
      }
      conditionsMap[cond.discount_id].push({
        condition_type: cond.condition_type,
        condition_value: cond.condition_value,
      });
    }
  }

  const discountRows: DiscountRow[] = (discounts ?? []).map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    type: d.type as "percentage" | "fixed_amount",
    value: d.value,
    applies_to: d.applies_to as "all" | "selected_products" | "selected_categories",
    min_purchase_amount: d.min_purchase_amount,
    valid_from: d.valid_from,
    valid_until: d.valid_until,
    is_active: d.is_active,
    usage_limit: d.usage_limit,
    used_count: d.used_count,
    created_at: d.created_at ?? new Date().toISOString(),
    conditions: conditionsMap[d.id] ?? [],
  }));

  return <DiscountsContent discounts={discountRows} />;
}
