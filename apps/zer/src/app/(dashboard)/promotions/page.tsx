import { withDbCapture } from "@zuiio/capture";
import { Suspense } from "react";
import { requireAppContext } from "@/lib/erp";
import { PromotionsContent } from "./promotions-content";

function PageSkeleton() {
  return <div className="h-96 animate-pulse rounded-xl bg-muted" />;
}

async function DataFetcher() {
  const { supabase, organizationId } = await requireAppContext();

  const { data: promotions } = await withDbCapture(
    "page:promotions promotions",
    supabase
      .from("promotions")
      .select(
        "id, name, description, type, is_active, priority, stackable, valid_from, valid_until, usage_limit, used_count, created_at",
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
  );

  // Count conditions per promotion
  const promoIds = (promotions ?? []).map((d) => d.id);
  const conditionsCountMap: Record<string, number> = {};
  if (promoIds.length > 0) {
    const { data: conditions } = await withDbCapture(
      "page:promotions conditions_count",
      supabase
        .from("promotion_conditions")
        .select("promotion_id")
        .in("promotion_id", promoIds),
    );
    for (const cond of conditions ?? []) {
      conditionsCountMap[cond.promotion_id] =
        (conditionsCountMap[cond.promotion_id] ?? 0) + 1;
    }
  }

  const promotionRows: PromotionRow[] = (promotions ?? []).map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    type: d.type as PromotionRow["type"],
    is_active: d.is_active,
    priority: d.priority,
    stackable: d.stackable,
    valid_from: d.valid_from,
    valid_until: d.valid_until,
    usage_limit: d.usage_limit,
    used_count: d.used_count,
    created_at: d.created_at ?? new Date().toISOString(),
    conditions_count: conditionsCountMap[d.id] ?? 0,
  }));

  return <PromotionsContent promotions={promotionRows} />;
}

export type PromotionRow = {
  id: string;
  name: string;
  description: string | null;
  type: "buy_x_get_y" | "threshold_discount" | "free_shipping" | "bundle_discount";
  is_active: boolean;
  priority: number;
  stackable: boolean;
  valid_from: string;
  valid_until: string | null;
  usage_limit: number | null;
  used_count: number;
  created_at: string;
  conditions_count: number;
};

export default async function PromotionsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DataFetcher />
    </Suspense>
  );
}
