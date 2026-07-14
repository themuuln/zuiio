"use client";

import { Folder } from "@phosphor-icons/react/dist/ssr";
import { useQuery } from "@tanstack/react-query";
import { withDbCapture } from "@zuiio/capture";
import { useEffect } from "react";
import { CategoriesTable } from "@/components/categories/categories-table";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { DynamicCategoryCreateDrawer } from "@/lib/dynamic-drawers";
import { useOrgSettings } from "@/lib/org-settings-context";
import { createClient } from "@/lib/supabase/client";

export type CategoryRow = {
  id: string;
  name: string;
  product_count: number;
};

export function CategoriesContent() {
  const { organizationId, hasCategories } = useOrgSettings();

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

  const categories = query.data ?? [];
  const isLoading = query.isLoading || query.isFetching;

  // Redirect if categories feature is disabled
  useEffect(() => {
    if (!hasCategories) {
      window.location.href = "/";
    }
  }, [hasCategories]);

  // Don't render anything while redirecting
  if (!hasCategories) return null;

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
