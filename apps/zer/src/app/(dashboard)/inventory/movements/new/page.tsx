import { Suspense } from "react";
import { requireAppContext } from "@/lib/erp";
import { withDbCapture } from "@zuiio/capture";
import { StockMovementForm } from "./stock-movement-form";

export type ProductOption = {
  id: string;
  name: string;
  current_stock: number | null;
  unit: string | null;
};

async function NewMovementDataFetcher() {
  const { supabase, organizationId } = await requireAppContext();

  const { data: products } = await withDbCapture(
    "page:movements_new",
    supabase
      .from("products")
      .select("id, name, current_stock, unit")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("name", { ascending: true }),
  );

  const productOptions: ProductOption[] =
    products?.map((p) => ({
      id: p.id,
      name: p.name,
      current_stock: p.current_stock,
      unit: p.unit,
    })) ?? [];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Барааны хөдөлгөөн бүртгэх
        </h1>
        <p className="text-sm text-muted-foreground">
          Орлого, тохируулгын хөдөлгөөнийг нэг дороос бүртгэнэ.
        </p>
      </div>
      <StockMovementForm products={productOptions} />
    </div>
  );
}

function NewMovementSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <div className="mb-2 h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-4 w-80 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}

export default async function NewStockMovementPage() {
  return (
    <Suspense fallback={<NewMovementSkeleton />}>
      <NewMovementDataFetcher />
    </Suspense>
  );
}
