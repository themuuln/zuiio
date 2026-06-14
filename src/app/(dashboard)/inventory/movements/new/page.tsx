import { requireAppContext } from "@/lib/erp";
import { StockMovementForm } from "./stock-movement-form";

export type ProductOption = {
  id: string;
  name: string;
  current_stock: number | null;
  unit: string | null;
};

export default async function NewStockMovementPage() {
  const { supabase, organizationId } = await requireAppContext();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, current_stock, unit")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true });

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
