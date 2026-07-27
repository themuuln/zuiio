"use client";

import { ArrowLeft, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { ShopProductRow } from "@/app/lib/data-shop";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { OrderDialog } from "./order-dialog";

interface ProductDetailClientProps {
  product: ShopProductRow;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [imgError, setImgError] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [orderOpen, setOrderOpen] = useState(false);

  const hasVariants = product.variants.length > 0;
  const currentVariant = hasVariants ? product.variants[selectedVariant] : null;
  const hasStock = currentVariant
    ? currentVariant.stock > 0
    : !hasVariants && product.is_available;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Back link */}
      <Link
        href="/shop"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Дэлгүүр лүү буцах
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Image */}
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface-1)]">
          {(product.images?.length ?? 0) > 0 && !imgError ? (
            // biome-ignore lint/performance/noImgElement: dynamic product image
            <img
              src={product.images?.[0]}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-muted-foreground/30">
              <ShoppingBag className="h-20 w-20" />
              <span className="text-sm font-medium uppercase tracking-wider">
                Зураг байхгүй
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-5">
          {/* Name + description */}
          <div>
            <h1 className="text-3xl font-bold leading-tight tracking-tight">
              {product.name}
            </h1>
            {product.name_en && (
              <p className="mt-1 text-muted-foreground">{product.name_en}</p>
            )}
          </div>

          {product.description && (
            <p className="leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          )}

          <Separator />

          {/* Price */}
          <p className="font-display text-3xl tracking-tight text-[var(--brand-sports)]">
            ₮{product.price_mnt.toLocaleString()}
          </p>

          {/* Variant selector with stock per size */}
          {hasVariants && (
            <div>
              <p className="mb-2.5 text-sm font-medium">Хэмжээ</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v, i) => {
                  const isSelected = i === selectedVariant;
                  const isOutOfStock = v.stock === 0;
                  const isLow = v.stock > 0 && v.stock <= 3;
                  return (
                    <Button
                      key={v.size}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      disabled={isOutOfStock}
                      onClick={() => setSelectedVariant(i)}
                      className={
                        isLow && !isOutOfStock && !isSelected
                          ? "border-orange-500/30 text-orange-600 hover:border-orange-500/50 dark:text-orange-400"
                          : ""
                      }
                    >
                      {v.size}
                      {isOutOfStock ? " (дууссан)" : ` (${v.stock})`}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selected variant low-stock warning */}
          {hasVariants &&
            currentVariant &&
            currentVariant.stock > 0 &&
            currentVariant.stock <= 5 && (
              <p className="flex items-center gap-2 text-sm text-orange-500">
                <span className="inline-flex h-2 w-2 rounded-full bg-orange-500" />
                Яараарай! Зөвхөн {currentVariant.stock} ширхэг үлдсэн.
              </p>
            )}

          {/* Buy button */}
          {!product.is_available || !hasStock ? (
            <p className="text-sm font-medium text-destructive">
              Энэ бүтээгдэхүүн дууссан
            </p>
          ) : (
            <Button
              size="lg"
              className="w-full md:w-auto"
              onClick={() => setOrderOpen(true)}
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              Худалдаж авах
            </Button>
          )}

          {/* Order dialog */}
          <OrderDialog
            open={orderOpen}
            onOpenChange={setOrderOpen}
            productId={product.id}
            variantIndex={selectedVariant}
            priceMnt={product.price_mnt}
            productName={product.name}
            variantSize={currentVariant ? `${currentVariant.size}` : "Стандарт"}
          />
        </div>
      </div>
    </div>
  );
}
