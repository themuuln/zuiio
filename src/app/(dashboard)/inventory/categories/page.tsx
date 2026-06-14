import { Folder } from "@phosphor-icons/react/dist/ssr";
import { CategoriesTable } from "@/components/categories/categories-table";
import { CategoryCreateDrawer } from "@/components/categories/category-create-drawer";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAppContext } from "@/lib/erp";

export type CategoryRow = {
  id: string;
  name: string;
  product_count: number;
};

export default async function CategoriesPage() {
  const { supabase, organizationId } = await requireAppContext();

  const { data: categories } = await supabase
    .from("categories")
    .select(`id, name, products(count)`)
    .eq("organization_id", organizationId)
    .order("name", { ascending: true });

  const tableData: CategoryRow[] =
    categories?.map((category) => ({
      id: category.id,
      name: category.name,
      product_count:
        (category.products as unknown as { count: number })?.count ?? 0,
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
        <Card>
          <CardHeader>
            <CardTitle>Ангиллын жагсаалт</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoriesTable data={tableData} />
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
