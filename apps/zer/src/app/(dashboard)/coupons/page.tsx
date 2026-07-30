import { withDbCapture } from "@zuiio/capture";
import { Suspense } from "react";
import { requireAppContext } from "@/lib/erp";
import { CouponsContent } from "./coupons-content";

function PageSkeleton() {
  return <div className="h-96 animate-pulse rounded-xl bg-muted" />;
}

async function DataFetcher() {
  const { supabase, organizationId } = await requireAppContext();

  const { data: coupons } = await withDbCapture(
    "page:coupons coupons",
    supabase
      .from("coupons")
      .select(
        "id, code, discount_type, discount_value, min_purchase_amount, max_discount_amount, valid_from, valid_until, usage_limit, used_count, per_customer_limit, applies_to, is_active, description, created_at",
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
  );

  const couponRows: CouponRow[] = (coupons ?? []).map((d) => ({
    id: d.id,
    code: d.code,
    discount_type: d.discount_type as "percentage" | "fixed_amount",
    discount_value: d.discount_value,
    min_purchase_amount: d.min_purchase_amount,
    max_discount_amount: d.max_discount_amount,
    valid_from: d.valid_from,
    valid_until: d.valid_until,
    usage_limit: d.usage_limit,
    used_count: d.used_count,
    per_customer_limit: d.per_customer_limit,
    applies_to: d.applies_to as "all" | "selected_products" | "selected_categories",
    is_active: d.is_active,
    description: d.description,
    created_at: d.created_at ?? new Date().toISOString(),
  }));

  return <CouponsContent coupons={couponRows} />;
}

export type CouponRow = {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  min_purchase_amount: number;
  max_discount_amount: number | null;
  valid_from: string;
  valid_until: string | null;
  usage_limit: number | null;
  used_count: number;
  per_customer_limit: number | null;
  applies_to: "all" | "selected_products" | "selected_categories";
  is_active: boolean;
  description: string | null;
  created_at: string;
};

export default async function CouponsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DataFetcher />
    </Suspense>
  );
}
