import { capture } from "@zuiio/capture";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductsPageClient } from "./products-page-client";

export type PublicProduct = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  unit: string | null;
  sale_price: number | null;
  current_stock: number | null;
  min_stock: number | null;
  category_name: string | null;
  category_id: string | null;
  image_url: string | null;
  description: string | null;
  attribute_count: number;
};

export type OrgMeta = {
  name: string;
  slug: string;
  currency: string;
  companyType: string;
};

export type PublicProductsData = {
  organization: OrgMeta;
  products: PublicProduct[];
};

export type PublicCategory = {
  id: string;
  name: string;
  product_count: number;
};

export default async function PublicProductsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  try {
    const [{ data: productsData, error: prodError }, { data: categoriesData }] =
      await Promise.all([
        supabase.rpc("get_public_products", { p_slug: slug }),
        supabase.rpc("get_public_categories", { p_slug: slug }),
      ]);

    if (prodError) {
      capture(prodError, { context: "public products: rpc" });
      notFound();
    }

    if (!productsData) {
      notFound();
    }

    const { organization, products } =
      productsData as unknown as PublicProductsData;
    const categories = (categoriesData ?? []) as unknown as PublicCategory[];

    return (
      <ProductsPageClient
        organization={organization}
        products={products}
        categories={categories}
      />
    );
  } catch (err) {
    capture(err, { context: "public products" });
    notFound();
  }
}
