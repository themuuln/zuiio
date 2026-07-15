"use client";

import { Folder } from "@phosphor-icons/react/dist/ssr";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { withDbCapture } from "@zuiio/capture";
import { useEffect, useMemo, useRef } from "react";
import { CategoriesTable } from "@/components/categories/categories-table";
import { seedPresetCategories } from "@/app/(dashboard)/inventory/categories/actions";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { PRESET_CATEGORIES } from "@/lib/constants";
import { DynamicCategoryCreateDrawer } from "@/lib/dynamic-drawers";
import { useOrgSettings } from "@/lib/org-settings-context";
import { createClient } from "@/lib/supabase/client";

export type CategoryRow = {
  id: string;
  name: string;
  product_count: number;
  /** True for built-in seed categories not yet persisted to the DB */
  isPreset?: boolean;
};

export function CategoriesContent() {
  const { organizationId, hasCategories, companyType } = useOrgSettings();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["categories", "list", organizationId],
    queryFn: async () => {
      const supabase = createClient();

      const [categoriesResult, productsResult] = await Promise.all([
        withDbCapture(
          "page:categories:categories",
          supabase
            .from("categories")
            .select("id, name")
            .eq("organization_id", organizationId)
            .order("name", { ascending: true }),
        ),
        withDbCapture(
          "page:categories:products",
          supabase
            .from("products")
            .select("id, category_id")
            .eq("organization_id", organizationId)
            .is("deleted_at", null),
        ),
      ]);

      const categories = categoriesResult.data;
      const products = productsResult.data ?? [];

      const productCountMap = new Map<string, number>();
      for (const product of products) {
        if (product.category_id) {
          productCountMap.set(
            product.category_id,
            (productCountMap.get(product.category_id) ?? 0) + 1,
          );
        }
      }

      return (categories?.map((category) => ({
        id: category.id,
        name: category.name,
        product_count: productCountMap.get(category.id) ?? 0,
      })) ?? []) as CategoryRow[];
    },
    enabled: !!organizationId,
  });

  const dbCategories = query.data ?? [];
  const isLoading = query.isPending;

  // Merge DB categories with preset seed categories for the org's company type.
  // Presets that already exist in the DB are excluded (DB is the source of truth).
  const categories = useMemo(() => {
    const dbNames = new Set(dbCategories.map((c) => c.name));
    const presets = (
      PRESET_CATEGORIES[companyType] ??
      PRESET_CATEGORIES.other ??
      []
    )
      .filter((name) => !dbNames.has(name))
      .map<CategoryRow>((name) => ({
        id: `preset:${name}`,
        name,
        product_count: 0,
        isPreset: true,
      }));
    return [...dbCategories, ...presets];
  }, [dbCategories, companyType]);

  // Seed preset categories on first load for existing orgs that predate the seeding feature.
  // Only runs when there are DB categories but some presets are still missing.
  const hasSeeded = useRef(false);
  useEffect(() => {
    if (hasSeeded.current || query.isPending || !organizationId) return;
    const presetNames =
      PRESET_CATEGORIES[companyType] ?? PRESET_CATEGORIES.other ?? [];
    const dbNames = new Set(dbCategories.map((c) => c.name));
    const missing = presetNames.filter((n) => !dbNames.has(n));
    if (missing.length === 0) return;
    hasSeeded.current = true;
    seedPresetCategories().then(() => {
      queryClient.invalidateQueries({ queryKey: ["categories", "list", organizationId] });
    });
  }, [query.isPending, organizationId, companyType, dbCategories, queryClient]);

  // Redirect if categories feature is disabled
  useEffect(() => {
    if (!hasCategories) {
      window.location.href = "/";
    }
  }, [hasCategories]);

  return (
    <PageShell
      title="Ангилалууд"
      description="Бүтээгдэхүүний ангиллуудыг нэг дороос удирдана."
      actions={<DynamicCategoryCreateDrawer />}
    >
      {!categories.length && !isLoading ? (
        <ErpEmptyState
          icon={<Folder className="size-4" />}
          title="Ангилал нэмэх"
          description="Бүтээгдэхүүний ангилал үүсгэснээр каталогийн зохион байгуулалтыг сайжруулна."
          action={<DynamicCategoryCreateDrawer />}
        />
      ) : (
        <CategoriesTable data={categories} loading={isLoading} />
      )}
    </PageShell>
  );
}
