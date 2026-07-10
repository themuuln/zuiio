import { Suspense } from "react";
import { requireAppContext } from "@/lib/erp";
import { AdjustmentCreateForm } from "./adjustment-create-form";
import { withDbCapture } from "@zuiio/capture";

export type ProductOption = {
  id: string;
  name: string;
  sku: string | null;
  current_stock: number | null;
  unit: string | null;
  cost_price: number | null;
  sale_price: number | null;
};

async function NewAdjustmentDataFetcher() {
  const { supabase, organizationId } = await requireAppContext();
  const { data: products } = await withDbCapture(
    "page:adjustments_new products",
    supabase
      .from("products")
      .select("id, name, sku, current_stock, unit, cost_price, sale_price")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("name"),
  );
  const productOptions: ProductOption[] =
    products?.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      current_stock: p.current_stock,
      unit: p.unit,
      cost_price: p.cost_price,
      sale_price: p.sale_price,
    })) ?? [];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Бөөнөөр тохируулга
        </h1>
        <p className="text-sm text-muted-foreground">
          Барааны үлдэгдлийг бөөнөөр тохируулах. Зөвхөн тохируулсан зөрүүг (шинэ
          үлдэгдэл - одоогийн үлдэгдэл) хадгална.
        </p>
      </div>
      <AdjustmentCreateForm products={productOptions} />
    </div>
  );
}

function NewAdjustmentSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <div className="mb-2 h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-96 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-96 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}

export default async function NewAdjustmentPage() {
  return (
    <Suspense fallback={<NewAdjustmentSkeleton />}>
      <NewAdjustmentDataFetcher />
    </Suspense>
  );
}
