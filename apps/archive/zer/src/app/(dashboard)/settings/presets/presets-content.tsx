"use client";

import { useQuery } from "@tanstack/react-query";
import { withDbCapture } from "@zuiio/capture";
import { useEffect } from "react";
import { useOrgSettings } from "@/lib/org-settings-context";
import { createClient } from "@/lib/supabase/client";
import { BrandPresetsClient } from "./presets-client";

interface Preset {
  id: string;
  brand_name: string;
  brand_logo_url: string | null;
  product_name: string;
  product_sku: string | null;
  category_name: string | null;
  unit: string | null;
  cost_price: number | null;
  sale_price: number | null;
  min_stock: number | null;
}

export function PresetsContent() {
  const { organizationId, hasBrands } = useOrgSettings();

  const query = useQuery({
    queryKey: ["presets", "list", organizationId],
    queryFn: async () => {
      const supabase = createClient();

      const presetsResult = await withDbCapture(
        "page:presets",
        supabase
          .from("product_presets")
          .select(
            "id, brand_name, brand_logo_url, product_name, product_sku, category_name, unit, cost_price, sale_price, min_stock, sort_order",
          )
          .order("sort_order"),
      );

      const { data: existingBrands } = await withDbCapture(
        "page:presets",
        supabase
          .from("brands")
          .select("name")
          .eq("organization_id", organizationId),
      );

      return {
        presets: (presetsResult.data ?? []) as Preset[],
        importedBrandNames: existingBrands?.map((b) => b.name) ?? [],
      };
    },
    enabled: !!organizationId,
  });

  const presets = query.data?.presets ?? [];
  const importedBrandNames = query.data?.importedBrandNames ?? [];
  const isLoading = query.isLoading || query.isFetching;

  // Redirect if brands feature is disabled
  useEffect(() => {
    if (!hasBrands) {
      window.location.href = "/";
    }
  }, [hasBrands]);

  // Don't render anything while redirecting
  if (!hasBrands) return null;

  return (
    <div className="flex flex-1 flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Брэнд сан</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Бэлэн брэнд, бүтээгдэхүүний загваруудаас сонгон импортлох
        </p>
      </div>
      {isLoading ? (
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      ) : (
        <BrandPresetsClient
          presets={presets}
          importedBrandNames={importedBrandNames}
        />
      )}
    </div>
  );
}
