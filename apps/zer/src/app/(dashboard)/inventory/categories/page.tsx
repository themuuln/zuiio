import { Folder } from "@phosphor-icons/react/dist/ssr";
import { redirect } from "next/navigation";
import { CategoriesTable } from "@/components/categories/categories-table";
import { CategoryCreateDrawer } from "@/components/categories/category-create-drawer";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { requireAppContext } from "@/lib/erp";
import { checkOrgSetting } from "@/lib/org-settings";



export type CategoryRow = {
  id: string;
  name: string;
  product_count: number;
};

export default async function CategoriesPage() {
  const { supabase, organizationId } = await requireAppContext();

  if (!(await checkOrgSetting(supabase, organizationId, "has_categories")))
    redirect("/");

  // Fetch categories and products separately to avoid RLS issues with
  // Supabase FK subqueries (products(count) doesn't resolve through RLS).
  const [categoriesResult, productsResult] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true }),
    supabase
      .from("products")
      .select("id, category_id")
      .eq("organization_id", organizationId)
      .is("deleted_at", null),
  ]);

  const categories = categoriesResult.data;
  const products = productsResult.data ?? [];

  // Count products per category_id in JavaScript
  const productCountMap = new Map<string, number>();
  for (const product of products) {
    if (product.category_id) {
      productCountMap.set(
        product.category_id,
        (productCountMap.get(product.category_id) ?? 0) + 1,
      );
    }
  }

  const tableData: CategoryRow[] =
    categories?.map((category) => ({
      id: category.id,
      name: category.name,
      product_count: productCountMap.get(category.id) ?? 0,
    })) ?? [];

  return (
    <PageShell
      title="Ангилалууд"
      description="Бүтээгдэхүүний ангиллуудыг нэг дороос удирдана."
      actions={<CategoryCreateDrawer />}
    >
      {!categories?.length ? (
        <ErpEmptyState
          icon={<Folder className="size-4" />}
          title="Ангилал нэмэх"
          description="Бүтээгдэхүүний ангилал үүсгэснээр каталогийн зохион байгуулалтыг сайжруулна."
          action={<CategoryCreateDrawer />}
        />
      ) : (
        <CategoriesTable data={tableData} />
      )}
    </PageShell>
  );
}
