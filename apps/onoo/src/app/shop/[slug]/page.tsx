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

function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    "http://localhost:3000"
  );
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getShopProductBySlug(slug);
  if (!product) return { title: "Бүтээгдэхүүн олдсонгүй | Onoo" };

  const images = product.images ?? [];
  const siteUrl = getSiteUrl();

  return {
    title: `${product.name} | Onoo дэлгүүр`,
    description:
      product.description ?? `${product.name} — Onoo брэндийн бүтээгдэхүүн`,
    openGraph: {
      title: product.name,
      description:
        product.description ??
        `₮${product.price_mnt.toLocaleString()} — Onoo брэндийн бүтээгдэхүүн`,
      images:
        images.length > 0
          ? [{ url: images[0], width: 1200, height: 1200, alt: product.name }]
          : [
              {
                url: `${siteUrl}/og-shop-default.png`,
                width: 1200,
                height: 630,
                alt: "Onoo дэлгүүр",
              },
            ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description:
        product.description ?? `${product.name} — Onoo брэндийн бүтээгдэхүүн`,
      images:
        images.length > 0 ? [images[0]] : [`${siteUrl}/og-shop-default.png`],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getShopProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const [relatedProducts, reviews, ratingSummary, bundles] = await Promise.all([
    getRelatedProducts(slug, product.category),
    getProductReviews(product.id),
    getProductRatingSummary(product.id),
    getProductBundles(product.id),
  ]);

  const siteUrl = getSiteUrl();
  const images = product.images ?? [];
  const variantList = product.variants
    .filter((v) => v.stock > 0)
    .map((v) => v.size);

  // ── JSON-LD: Product ────────────────────────────────────────
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      product.description ?? `${product.name} — Onoo брэндийн бүтээгдэхүүн`,
    image: images.length > 0 ? images : undefined,
    sku: `ONOO-${product.id.slice(0, 8).toUpperCase()}`,
    brand: {
      "@type": "Brand",
      name: "Onoo",
    },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/shop/${product.slug}`,
      priceCurrency: "MNT",
      price: product.price_mnt,
      availability: product.is_available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      ...(variantList.length > 0 && {
        size: variantList,
      }),
    },
  };

  // ── JSON-LD: BreadcrumbList ─────────────────────────────────
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Нүүр",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Дэлгүүр",
        item: `${siteUrl}/shop`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
      },
    ],
  };

  const jsonLdHtml = {
    __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c"),
  };
  const breadcrumbJsonLdHtml = {
    __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
  };

  return (
    <div className="min-h-screen">
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: standard JSON-LD pattern from Next.js docs
        dangerouslySetInnerHTML={jsonLdHtml}
      />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: standard JSON-LD pattern from Next.js docs
        dangerouslySetInnerHTML={breadcrumbJsonLdHtml}
      />
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
