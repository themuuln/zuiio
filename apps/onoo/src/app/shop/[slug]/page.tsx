import { notFound } from "next/navigation";
import {
  getProductBundles,
  getProductRatingSummary,
  getProductReviews,
  getRelatedProducts,
  getShopProductBySlug,
} from "@/app/lib/data-shop";
import { ProductDetailClient } from "../components/product-detail-client";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getShopProductBySlug(slug);
  if (!product) return { title: "Бүтээгдэхүүн олдсонгүй | Onoo" };

  return {
    title: `${product.name} | Onoo дэлгүүр`,
    description:
      product.description ?? `${product.name} — Onoo брэндийн бүтээгдэхүүн`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getShopProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const [relatedProducts, reviews, ratingSummary, bundles] =
    await Promise.all([
      getRelatedProducts(slug, product.category),
      getProductReviews(product.id),
      getProductRatingSummary(product.id),
      getProductBundles(product.id),
    ]);

  return (
    <div className="min-h-screen">
      <ProductDetailClient
        product={product}
        relatedProducts={relatedProducts}
        reviews={reviews}
        ratingSummary={ratingSummary}
        bundles={bundles}
      />
    </div>
  );
}
