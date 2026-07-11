"use client";

import {
  Info,
  Leaf,
  MagnifyingGlassPlus,
  Scroll,
  StackSimple,
} from "@phosphor-icons/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";
import type { OrgMeta, PublicProduct } from "./page";

type ProductDetail = PublicProduct & {
  additional_info?: string | null;
  usage_instructions?: string | null;
  care_instructions?: string | null;
  created_at?: string | null;
  images?: string[];
  attributes?: {
    name: string;
    slug?: string;
    value_text?: string | null;
    value_number?: number | null;
    unit?: string | null;
  }[];
  variants?: {
    id: string;
    sku?: string | null;
    sale_price?: number | null;
    current_stock?: number | null;
    option_labels: string;
  }[];
};

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
    <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
      <h3 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        {title}
      </h3>
      <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
        {content}
      </p>
    </div>
  );
}

export function ProductDetailDrawer({
  product,
  organization,
  children,
}: {
  product: ProductDetail;
  organization: OrgMeta;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const stock = Number(product.current_stock ?? 0);
  const minStock = Number(product.min_stock ?? 0);
  const isLow = stock > 0 && stock <= minStock;
  const isOut = stock <= 0;
  const images = product.images ?? [];
  const hasAttributes = (product.attributes?.length ?? 0) > 0;
  const hasVariants = product.variants && product.variants.length > 0;
  const hasStorytelling =
    product.description ||
    product.additional_info ||
    product.usage_instructions ||
    product.care_instructions;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer"
      >
        {children}
      </button>

      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        title={product.name}
        description={organization.name}
        maxHeight="90dvh"
        footer={
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Хаах
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Image gallery */}
          {images.length > 0 && (
            <div>
              <div className="relative overflow-hidden rounded-xl bg-muted">
                {/* biome-ignore lint/performance/noImgElement: Supabase storage URLs */}
                <img
                  src={images[0]}
                  alt={product.name}
                  className="aspect-[16/10] w-full object-cover"
                />
              </div>
              {images.length > 1 && (
                <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <div
                      key={img}
                      className="relative shrink-0 overflow-hidden rounded-lg border-2 border-border/60"
                    >
                      {/* biome-ignore lint/performance/noImgElement: Supabase storage URLs */}
                      <img
                        src={img}
                        alt={`${product.name} ${i + 1}`}
                        className="h-16 w-16 object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Category + attributes badges */}
          <div className="flex flex-wrap gap-2">
            {product.category_name && (
              <Badge variant="secondary">{product.category_name}</Badge>
            )}
            {hasAttributes && (
              <Badge variant="outline" className="gap-1">
                <Info className="size-3" />
                {product.attributes?.length} шинж чанар
              </Badge>
            )}
            {hasVariants && (
              <Badge variant="outline" className="gap-1">
                <StackSimple className="size-3" />
                {product.variants?.length} вариант
              </Badge>
            )}
          </div>

          {/* Price + stock */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border/80 bg-card p-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Үнэ
              </p>
              <p className="mt-1 text-xl font-bold tracking-tight tabular-nums">
                {formatCurrency(Number(product.sale_price ?? 0))}
              </p>
            </div>
            <div className="rounded-lg border border-border/80 bg-card p-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Нөөц
              </p>
              <p
                className={`mt-1 text-xl font-bold tracking-tight tabular-nums ${
                  isOut
                    ? "text-destructive"
                    : isLow
                      ? "text-amber-600"
                      : "text-emerald-600"
                }`}
              >
                {stock}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  {product.unit ?? "ширхэг"}
                </span>
              </p>
              {minStock > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  Доод түвшин: {minStock}
                </p>
              )}
            </div>
          </div>

          {/* Attributes */}
          {hasAttributes && (
            <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Info className="size-4" />
                Шинж чанар
              </h3>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                {product.attributes?.map((attr) => (
                  <div key={attr.slug ?? attr.name} className="contents">
                    <dt className="text-muted-foreground">{attr.name}</dt>
                    <dd className="font-medium text-right">
                      {attr.value_text ??
                        (attr.value_number != null
                          ? `${attr.value_number}${attr.unit ? ` ${attr.unit}` : ""}`
                          : "—")}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Storytelling sections */}
          {hasStorytelling && (
            <div className="space-y-3">
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
          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Мэдээлэл
            </h3>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              {product.sku && (
                <div className="contents">
                  <dt className="text-muted-foreground">SKU</dt>
                  <dd className="font-medium text-right">{product.sku}</dd>
                </div>
              )}
              {product.barcode && (
                <div className="contents">
                  <dt className="text-muted-foreground">Barcode</dt>
                  <dd className="font-medium text-right font-mono">
                    {product.barcode}
                  </dd>
                </div>
              )}
              {product.unit && (
                <div className="contents">
                  <dt className="text-muted-foreground">Нэгж</dt>
                  <dd className="font-medium text-right">{product.unit}</dd>
                </div>
              )}
              {product.category_name && (
                <div className="contents">
                  <dt className="text-muted-foreground">Ангилал</dt>
                  <dd className="font-medium text-right">
                    {product.category_name}
                  </dd>
                </div>
              )}
              {product.created_at && (
                <div className="contents">
                  <dt className="text-muted-foreground">Бүртгэсэн</dt>
                  <dd className="font-medium text-right">
                    {formatDate(product.created_at)}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
