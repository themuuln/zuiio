"use client";

import { ArrowLeft, ImageOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { ShopProductRow } from "@/app/lib/data-shop";
import { Button } from "@/components/ui/button";
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
        className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Дэлгүүр лүү буцах
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Image */}
        <div className="flex aspect-square items-center justify-center rounded-lg bg-muted">
          {(product.images?.length ?? 0) > 0 && !imgError ? (
            <img
              src={product.images![0]}
              alt={product.name}
              className="h-full w-full rounded-lg object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <ImageOff className="h-24 w-24 text-muted-foreground/50" />
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            {product.name_en && (
              <p className="text-muted-foreground">{product.name_en}</p>
            )}
          </div>

          {product.description && (
            <p className="text-muted-foreground">{product.description}</p>
          )}

          <p className="text-2xl font-bold">
            ₮{product.price_mnt.toLocaleString()}
          </p>

          {/* Variant selector */}
          {hasVariants && (
            <div>
              <p className="mb-2 text-sm font-medium">Хэмжээ</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v, i) => (
                  <Button
                    key={v.size}
                    variant={i === selectedVariant ? "default" : "outline"}
                    size="sm"
                    disabled={v.stock === 0}
                    onClick={() => setSelectedVariant(i)}
                  >
                    {v.size}
                    {v.stock === 0 && " (дууссан)"}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Buy button */}
          {!product.is_available || !hasStock ? (
            <p className="text-destructive">Энэ бүтээгдэхүүн дууссан</p>
          ) : (
            <Button
              size="lg"
              className="w-full md:w-auto"
              onClick={() => setOrderOpen(true)}
            >
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
          />
        </div>
      </div>
    </div>
  );
}
