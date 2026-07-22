"use client";

import { ImageOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { ShopProductRow } from "@/app/lib/data-shop";

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

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group rounded-lg border bg-card p-4 transition-colors hover:border-primary/50"
    >
      {/* Image placeholder */}
      <div className="mb-4 flex aspect-square items-center justify-center rounded-md bg-muted">
        {(product.images?.length ?? 0) > 0 && !imgError ? (
          <img
            src={product.images?.[0]}
            alt={product.name}
            className="h-full w-full rounded-md object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <ImageOff className="h-12 w-12 text-muted-foreground/50" />
        )}
      </div>

      {/* Name */}
      <h3 className="font-semibold">{product.name}</h3>
      {product.name_en && (
        <p className="text-xs text-muted-foreground">{product.name_en}</p>
      )}

      {/* Price */}
      <p className="mt-1 text-lg font-bold">
        ₮{product.price_mnt.toLocaleString()}
      </p>

      {/* Stock / availability */}
      {!product.is_available || !hasStock ? (
        <p className="mt-2 text-sm text-destructive">Дууссан</p>
      ) : (
        hasVariants && (
          <p className="mt-2 text-sm text-muted-foreground">
            {product.variants.length} хэмжээтэй
          </p>
        )
      )}
    </Link>
  );
}
