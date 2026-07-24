import {
  ArrowLeft,
  Info,
  Leaf,
  MagnifyingGlassPlus,
  Package,
  Scroll,
} from "@phosphor-icons/react/dist/ssr";
import { capture } from "@zuiio/capture";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { getCompanyTypeLabel } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

type AttributeValue = {
  name: string;
  slug: string;
  value_type: string;
  unit: string | null;
  value_text: string | null;
  value_number: number | null;
  value_boolean: boolean | null;
  sort_order: number;
};

type ProductDetail = {
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
  created_at: string | null;
  description: string | null;
  additional_info: string | null;
  usage_instructions: string | null;
  care_instructions: string | null;
  images: string[];
  attributes: AttributeValue[];
};

type PublicProductDetailData = {
  organization: {
    name: string;
    slug: string;
    currency: string;
    companyType: string;
  };
  product: ProductDetail;
};

export default function PublicProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductDetailDataFetcher params={params} />
    </Suspense>
  );
}

async function ProductDetailDataFetcher({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.rpc("get_public_product", {
      p_slug: slug,
      p_product_id: id,
    });

    if (error) {
      capture(error, { context: "public product detail: rpc" });
      notFound();
    }

    if (!data) {
      notFound();
    }

    const { organization, product } =
      data as unknown as PublicProductDetailData;
    const stock = Number(product.current_stock ?? 0);
    const minStock = Number(product.min_stock ?? 0);
    const isLow = stock > 0 && stock <= minStock;
    const isOut = stock <= 0;
    const images = product.images ?? [];
    const hasAttributes = product.attributes?.length > 0;
    const hasStorytelling =
      product.description ||
      product.additional_info ||
      product.usage_instructions ||
      product.care_instructions;

    return (
      <div className="min-h-dvh bg-background">
        {/* Sticky header */}
        <div className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 sm:px-6">
            <Link
              href={`/${slug}/products`}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-4" /> Буцах
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="truncate text-sm font-medium">{product.name}</span>
          </div>
        </div>

        <div className="mx-auto max-w-4xl space-y-0 p-4 sm:p-6 lg:p-8">
          {/* Image gallery */}
          {images.length > 0 ? (
            <div className="mb-8 space-y-3">
              <div className="relative overflow-hidden rounded-2xl bg-muted">
                <OptimizedImage
                  src={images[0]}
                  alt={product.name}
                  className="aspect-[4/3] w-full object-cover"
                  width={800}
                  priority
                />
              </div>
              {/* Thumbnails if multiple */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {images.map((img, i) => (
                    <div
                      key={img}
                      className="relative shrink-0 overflow-hidden rounded-lg border-2 border-border/60"
                    >
                      <OptimizedImage
                        src={img}
                        alt={`${product.name} ${i + 1}`}
                        className="h-20 w-20 object-cover"
                        width={80}
                        height={80}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="mb-8 flex aspect-[4/3] items-center justify-center rounded-2xl bg-muted/50">
              <Package className="size-16 text-muted-foreground/15" />
            </div>
          )}

          {/* Title + org info */}
          <div className="space-y-2 mb-6">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {getCompanyTypeLabel(organization.companyType)} &middot;{" "}
              {organization.name}
            </p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {product.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              {product.category_name && (
                <Badge variant="secondary">{product.category_name}</Badge>
              )}
              {hasAttributes && (
                <Badge variant="outline" className="gap-1">
                  <Info className="size-3" />
                  {product.attributes.length} шинж чанар
                </Badge>
              )}
            </div>
          </div>

          {/* Price + stock cards */}
          <div className="grid gap-4 sm:grid-cols-2 mb-8">
            <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Үнэ
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">
                {formatCurrency(Number(product.sale_price ?? 0))}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {organization.currency}
              </p>
            </div>

            <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Нөөц
              </p>
              <p
                className={`mt-2 text-3xl font-bold tracking-tight tabular-nums ${
                  isOut
                    ? "text-destructive"
                    : isLow
                      ? "text-amber-600"
                      : "text-emerald-600"
                }`}
              >
                {stock}{" "}
                <span className="text-base font-normal">
                  {product.unit ?? "ширхэг"}
                </span>
              </p>
              {minStock > 0 && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Доод түвшин: {minStock}
                </p>
              )}
            </div>
          </div>

          {/* Attributes section */}
          {hasAttributes && (
            <div className="mb-8 rounded-xl border border-border/80 bg-card p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                <Info className="size-4" />
                Шинж чанар
              </h2>
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
                {product.attributes.map((attr) => (
                  <AttributeRow key={attr.slug} attribute={attr} />
                ))}
              </dl>
            </div>
          )}

          {/* Storytelling sections */}
          {hasStorytelling && (
            <div className="mb-8 space-y-6">
              {product.description && (
                <Section
                  icon={<Scroll className="size-4" />}
                  title="Тайлбар"
                  content={product.description}
                />
              )}
              {product.additional_info && (
                <Section
                  icon={<Info className="size-4" />}
                  title="Нэмэлт мэдээлэл"
                  content={product.additional_info}
                />
              )}
              {product.usage_instructions && (
                <Section
                  icon={<MagnifyingGlassPlus className="size-4" />}
                  title="Хэрэглэх заавар"
                  content={product.usage_instructions}
                />
              )}
              {product.care_instructions && (
                <Section
                  icon={<Leaf className="size-4" />}
                  title="Арчилгаа"
                  content={product.care_instructions}
                />
              )}
            </div>
          )}

          {/* Basic details */}
          <div className="mb-8 rounded-xl border border-border/80 bg-card p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Мэдээлэл
            </h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
              {product.sku && (
                <>
                  <dt className="text-muted-foreground">SKU</dt>
                  <dd className="font-medium">{product.sku}</dd>
                </>
              )}
              {product.barcode && (
                <>
                  <dt className="text-muted-foreground">Barcode</dt>
                  <dd className="font-medium font-mono">{product.barcode}</dd>
                </>
              )}
              {product.unit && (
                <>
                  <dt className="text-muted-foreground">Нэгж</dt>
                  <dd className="font-medium">{product.unit}</dd>
                </>
              )}
              {product.category_name && (
                <>
                  <dt className="text-muted-foreground">Ангилал</dt>
                  <dd className="font-medium">{product.category_name}</dd>
                </>
              )}
              {product.created_at && (
                <>
                  <dt className="text-muted-foreground">Бүртгэсэн</dt>
                  <dd className="font-medium">
                    {formatDate(product.created_at)}
                  </dd>
                </>
              )}
            </dl>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border/60 bg-card/30 py-6 text-center text-xs text-muted-foreground">
          <p>{organization.name} &middot; Нээлттэй мэдээлэл</p>
          <p className="mt-0.5">Zer ERP дэмждэг</p>
        </div>
      </div>
    );
  } catch (err) {
    capture(err, { context: "public product detail" });
    notFound();
  }
}

function ProductDetailSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      {/* Header skeleton */}
      <div className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="h-4 w-px bg-muted" />
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-0 p-4 sm:p-6 lg:p-8">
        {/* Image skeleton */}
        <div className="mb-8 space-y-3">
          <div className="aspect-[4/3] w-full animate-pulse rounded-2xl bg-muted" />
          <div className="flex gap-2">
            <div className="h-20 w-20 animate-pulse rounded-lg bg-muted" />
            <div className="h-20 w-20 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>

        {/* Title skeleton */}
        <div className="space-y-2 mb-6">
          <div className="h-3 w-48 animate-pulse rounded bg-muted" />
          <div className="h-8 w-64 animate-pulse rounded bg-muted" />
          <div className="flex gap-2">
            <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />
          </div>
        </div>

        {/* Cards skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
            <div className="h-3 w-12 animate-pulse rounded bg-muted mb-2" />
            <div className="h-8 w-24 animate-pulse rounded bg-muted" />
          </div>
          <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
            <div className="h-3 w-12 animate-pulse rounded bg-muted mb-2" />
            <div className="h-8 w-24 animate-pulse rounded bg-muted" />
          </div>
        </div>

        {/* Details skeleton */}
        <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
          <div className="h-3 w-24 animate-pulse rounded bg-muted mb-4" />
          <div className="space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AttributeRow({ attribute }: { attribute: AttributeValue }) {
  let displayValue: string;

  if (attribute.value_type === "boolean") {
    displayValue = attribute.value_boolean ? "Тийм" : "Үгүй";
  } else if (
    attribute.value_type === "number" &&
    attribute.value_number != null
  ) {
    displayValue = `${attribute.value_number}${attribute.unit ? ` ${attribute.unit}` : ""}`;
  } else {
    displayValue = attribute.value_text ?? "—";
  }

  return (
    <>
      <dt className="text-muted-foreground">{attribute.name}</dt>
      <dd className="font-medium">{displayValue}</dd>
    </>
  );
}

function Section({
  icon,
  title,
  content,
}: {
  icon: React.ReactNode;
  title: string;
  content: string;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        {title}
      </h2>
      <div className="prose prose-sm prose-neutral max-w-none text-foreground/90 whitespace-pre-line leading-relaxed">
        {content}
      </div>
    </div>
  );
}
