import { redirect } from "next/navigation";
import { requireAppContext } from "@/lib/erp";
import { checkOrgSetting } from "@/lib/org-settings";
import { createServiceClient } from "@/lib/supabase/server-service";
import { BrandPresetsClient } from "./presets-client";

export default async function PresetsPage() {
  const { supabase, organizationId } = await requireAppContext();
  if (!(await checkOrgSetting(supabase, organizationId, "has_brands")))
    redirect("/");
  const serviceSupabase = createServiceClient();

  const presetsData = await serviceSupabase
    .from("product_presets")
    .select("*")
    .order("sort_order");

  const { data: existingBrands } = await supabase
    .from("brands")
    .select("name")
    .eq("organization_id", organizationId);
  const importedBrandNames = existingBrands?.map((b) => b.name) ?? [];

  return (
    <div className="flex flex-1 flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Брэнд сан</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Бэлэн брэнд, бүтээгдэхүүний загваруудаас сонгон импортлох
        </p>
      </div>
      <BrandPresetsClient
        presets={presetsData.data ?? []}
        importedBrandNames={importedBrandNames}
      />
    </div>
  );
}
