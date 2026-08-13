"use client";

import { ArrowRight, Info } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { useStorefrontBase } from "@/components/storefront/storefront-base-provider";
import { Badge } from "@/components/ui/badge";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { formatCurrency } from "@/lib/format";
import type { OrgMeta, PublicProduct } from "./page";

/**
 * Quick-look bottom sheet opened from a product card on the storefront home
 * and catalog pages. Redesigned 2026-08-13 after a live visual pass: single
 * primary CTA in the footer (add to cart), "view full page" as a text link,
 * no redundant close button (swipe / X / backdrop close it), promo badge
 * surfaced next to the price, and a plain-text description instead of a
 * heavy bordered card.
 */
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
  const price = Number(product.sale_price ?? 0);
  const base = useStorefrontBase();

  return (
    <>
      {/* Whole card opens the drawer via an overlay trigger button. The
          card's own AddToCartButton is raised above the overlay (z-20, see
          ProductCard) so the two interactive elements are siblings — never
          nested — which keeps the markup axe-compliant.
          `isolate` creates a stacking context for the whole card: the
          z-10 overlay and the card's z-20 add button compete only inside
          the card, and the card as a unit paints at z auto — so page-level
          overlays (e.g. the mobile filter panel, z-20, rendered earlier in
          the DOM) always cover the card instead of the button leaking on
          top of them. */}
      <div className="relative isolate cursor-pointer">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`${product.name} дэлгэрэнгүй үзэх`}
          className="absolute inset-0 z-10 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="relative">{children}</div>
      </div>

      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        title={product.name}
        description={organization.name}
        maxHeight="calc(90dvh + 3rem)"
        footer={
          <div className="flex items-center gap-3">
            <Link
              href={`${base}/products/${product.id}`}
              onClick={() => setOpen(false)}
              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              Бүтээгдэхүүний хуудас
              <ArrowRight className="size-3.5" />
            </Link>
            <AddToCartButton
              className="flex-1"
              item={{
                productId: product.id,
                name: product.name,
                unitPrice: price,
                unit: product.unit ?? "ширхэг",
                maxStock: Number.POSITIVE_INFINITY,
              }}
            />
          </div>
        }
      >
        <div className="space-y-5">
          {/* Image */}
          {product.image_url && (
            <div className="relative overflow-hidden rounded-2xl bg-muted">
              <OptimizedImage
                src={product.image_url}
                alt={product.name}
                width={1024}
                aspectRatio="4/3"
                priority
                className="w-full"
              />
            </div>
          )}

          {/* Category + attributes + promo chips */}
          <div className="flex flex-wrap items-center gap-2">
            {product.category_name && (
              <Badge variant="secondary">{product.category_name}</Badge>
            )}
            {product.promo?.reward_label && (
              <Badge className="gap-1">{product.promo.reward_label}</Badge>
            )}
            {product.attribute_count > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Info className="size-3.5" />
                {product.attribute_count} шинж чанар
              </span>
            )}
          </div>

          {/* Price */}
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-bold tracking-tight tabular-nums">
                {formatCurrency(price)}
                {organization.currency && (
                  <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                    {organization.currency}
                  </span>
                )}
              </p>
              {product.unit && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Нэгж: {product.unit}
                </p>
              )}
            </div>
            {product.promo?.title && (
              <p className="max-w-[55%] text-right text-xs font-medium text-primary">
                {product.promo.title}
              </p>
            )}
          </div>

          {/* Description — plain text, no box */}
          {product.description && (
            <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
              {product.description}
            </p>
          )}
        </div>
      </BottomSheet>
    </>
  );
}
