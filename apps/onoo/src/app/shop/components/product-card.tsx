/*
 * ProductCard — branded shop card with image, details, and stock status.
 * Matches Onoo design: dark surface, Oswald display price, orange accent on hover.
 */
"use client";

import { BadgeCheck, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { ShopProductRow } from "@/app/lib/data-shop";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: ShopProductRow;
}

export function ProductCard({ product }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const hasVariants = product.variants.length > 0;
  const totalStock = hasVariants
    ? product.variants.reduce((s, v) => s + v.stock, 0)
    : 0;
  const hasStock = hasVariants ? totalStock > 0 : product.is_available;
  const outOfStock = !product.is_available || !hasStock;

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border/50 bg-[var(--surface-1)] transition-all duration-[var(--duration-normal)] ease-[var(--ease-sport)] hover:border-[var(--brand-sports)]/40 hover:bg-[var(--surface-2)] hover:shadow-[0_8px_32px_rgb(0_0_0/0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {/* Image container */}
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-[var(--surface-2)]">
        {(product.images?.length ?? 0) > 0 && !imgError ? (
          <img
            src={product.images?.[0]}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-[var(--duration-normal)] ease-[var(--ease-sport)] group-hover:scale-[1.03]"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
            <ShoppingBag className="size-10" aria-hidden="true" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              Зураг байхгүй
            </span>
          </div>
        )}

        {/* Stock badge */}
        {outOfStock ? (
          <Badge
            variant="destructive"
            className="absolute right-2 top-2 pointer-events-none"
          >
            Дууссан
          </Badge>
        ) : (
          <Badge
            variant="secondary"
            className="absolute right-2 top-2 gap-1 border-border/30 bg-[var(--surface-1)]/80 backdrop-blur-sm pointer-events-none"
          >
            <BadgeCheck className="size-3 text-[var(--success)]" aria-hidden="true" />
            <span>Бэлэн</span>
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5 p-4">
        {/* Name */}
        <h3 className="line-clamp-1 font-semibold text-[var(--ink)]">
          {product.name}
        </h3>
        {product.name_en && (
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {product.name_en}
          </p>
        )}

        {/* Price with Oswald display */}
        <p className="mt-auto pt-1 font-display text-xl tracking-tight text-[var(--brand-sports)]">
          ₮{product.price_mnt.toLocaleString()}
        </p>

        {/* Variant info */}
        {hasVariants && !outOfStock && (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <ShoppingBag className="size-3" aria-hidden="true" />
            {product.variants.length} хэмжээтэй
          </p>
        )}
      </div>
    </Link>
  );
}
