"use client";

import { Info } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { Badge } from "@/components/ui/badge";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import type { OrgMeta, PublicProduct } from "./page";

export function ProductDetailDrawer({
  product,
  organization,
  children,
}: {
  product: PublicProduct;
  organization: OrgMeta;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Whole card opens the drawer via an overlay trigger button. The
          card's own AddToCartButton is raised above the overlay (z-20, see
          ProductCard) so the two interactive elements are siblings — never
          nested — which keeps the markup axe-compliant. */}
      <div className="relative cursor-pointer">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`${product.name} дэлгэрэнгүй үзэх`}
          className="absolute inset-0 z-10 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {/* No z-index here: a stacking context would trap the card's
            z-20 add button below the overlay. The button competes with
            the overlay in the same stacking context and wins. */}
        <div className="relative">{children}</div>
      </div>

      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        title={product.name}
        description={organization.name}
        maxHeight="calc(90dvh + 3rem)"
        footer={
          <div className="flex gap-2">
            <Link
              href={`/${organization.slug}/products/${product.id}`}
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              <Button variant="outline" className="w-full">
                Бүтээгдэхүүний хуудас
              </Button>
            </Link>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Хаах
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Image */}
          {product.image_url && (
            <div className="relative overflow-hidden rounded-xl bg-muted">
              {/* biome-ignore lint/performance/noImgElement: Supabase storage URLs */}
              <img
                src={product.image_url}
                alt={product.name}
                className="aspect-[16/10] w-full object-cover"
              />
            </div>
          )}

          {/* Category + attributes badges */}
          <div className="flex flex-wrap gap-2">
            {product.category_name && (
              <Badge variant="secondary">{product.category_name}</Badge>
            )}
            {product.attribute_count > 0 && (
              <Badge variant="outline" className="gap-1">
                <Info className="size-3" />
                {product.attribute_count} шинж чанар
              </Badge>
            )}
          </div>

          {/* Price */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Үнэ
            </p>
            <p className="mt-1 text-xl font-bold tracking-tight tabular-nums">
              {formatCurrency(Number(product.sale_price ?? 0))}
              {organization.currency && (
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  {organization.currency}
                </span>
              )}
            </p>
          </div>

          {/* Description */}
          {product.description && (
            <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Add to cart */}
          <AddToCartButton
            className="w-full"
            item={{
              productId: product.id,
              name: product.name,
              unitPrice: Number(product.sale_price ?? 0),
              unit: product.unit ?? "ширхэг",
              maxStock: Number.POSITIVE_INFINITY,
            }}
          />
        </div>
      </BottomSheet>
    </>
  );
}
