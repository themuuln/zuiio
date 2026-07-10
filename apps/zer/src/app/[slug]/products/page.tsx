import { capture } from "@zuiio/capture";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductsPageClient } from "./products-page-client";

type PublicProduct = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  unit: string | null;
  sale_price: number | null;
  current_stock: number | null;
  min_stock: number | null;
  category_name: string | null;
};

type OrgMeta = {
  name: string;
  slug: string;
  currency: string;
  companyType: string;
};

type PublicProductsData = {
  organization: OrgMeta;
  products: PublicProduct[];
};

export default async function PublicProductsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.rpc("get_public_products", {
      p_slug: slug,
    });

    if (error) {
      capture(error, { context: "public products: rpc" });
      notFound();
    }

    if (!data) {
      notFound();
    }

    const { organization, products } = data as unknown as PublicProductsData;

    return (
      <ProductsPageClient organization={organization} products={products} />
    );
  } catch (err) {
    capture(err, { context: "public products" });
    notFound();
  }
}
