import { notFound } from "next/navigation";
import { getShopProductBySlug } from "@/app/lib/data-shop";
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

  return (
    <div className="min-h-screen">
      <ProductDetailClient product={product} />
    </div>
  );
}
