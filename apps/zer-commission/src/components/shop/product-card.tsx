"use client";

import { CaretLeft, CaretRight, ShoppingCart } from "@phosphor-icons/react";
import { useState } from "react";
import { useCart } from "@/app/(dashboard)/shop/cart-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ProductCardProduct = {
  id: string;
  name: string;
  sale_price: number | null;
  current_stock: number | null;
  unit: string | null;
  sku: string | null;
  category_id: string | null;
  image_url?: string | null;
  image_urls?: string[] | null;
};

export function ProductCard({ product }: { product: ProductCardProduct }) {
  const { addItem } = useCart();
  const price = Number(product.sale_price ?? 0);
  const stock = Number(product.current_stock ?? 0);
  const unit = product.unit ?? "ш";
  const isOutOfStock = stock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem({
      productId: product.id,
      name: product.name,
      unitPrice: price,
      unit,
      maxStock: stock,
    });
  };

  const [imgIndex, setImgIndex] = useState(0);
  const images = product.image_urls?.length
    ? product.image_urls
    : product.image_url
      ? [product.image_url]
      : [];

  return (
    <Card
      className={cn(
        "flex flex-col gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md",
        isOutOfStock && "opacity-60",
      )}
    >
      {/* Top section: image gallery */}
      <div
        className={cn(
          "group relative flex aspect-square items-center justify-center overflow-hidden bg-muted/30",
          isOutOfStock && "bg-muted/10",
        )}
      >
        {images.length > 0 ? (
          <>
            <img
              src={images[imgIndex]}
              alt={product.name}
              className="h-full w-full object-cover transition-opacity"
              loading="lazy"
            />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setImgIndex((i) => (i - 1 + images.length) % images.length);
                  }}
                  className="absolute left-1 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity hover:bg-black/60 group-hover:opacity-100"
                >
                  <CaretLeft className="size-3.5" weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setImgIndex((i) => (i + 1) % images.length);
                  }}
                  className="absolute right-1 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity hover:bg-black/60 group-hover:opacity-100"
                >
                  <CaretRight className="size-3.5" weight="bold" />
                </button>
                <div className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-1">
                  {images.map((url, i) => (
                    <button
                      key={url}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setImgIndex(i);
                      }}
                      className={cn(
                        "size-1.5 rounded-full transition-all",
                        i === imgIndex
                          ? "bg-white w-3"
                          : "bg-white/50 hover:bg-white/80",
                      )}
                    />
                  ))}
                </div>
              </>
            )}
            {isOutOfStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Badge
                  variant="outline"
                  className="border-destructive/40 text-destructive"
                >
                  Дууссан
                </Badge>
              </div>
            )}
          </>
        ) : isOutOfStock ? (
          <Badge
            variant="outline"
            className="border-destructive/40 text-destructive"
          >
            Дууссан
          </Badge>
        ) : (
          <span className="text-3xl text-muted-foreground/30">
            {product.name.charAt(0)}
          </span>
        )}
      </div>

      <CardContent className="flex flex-1 flex-col gap-1.5 px-3 py-3">
        {/* Name */}
        <h3 className="line-clamp-2 text-sm font-medium leading-tight">
          {product.name}
        </h3>

        {/* SKU */}
        {product.sku && (
          <p className="text-[11px] text-muted-foreground">{product.sku}</p>
        )}

        {/* Price */}
        <p className="mt-auto text-base font-semibold text-primary">
          {price.toLocaleString()}₮
        </p>

        {/* Stock + unit */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>
            {stock} {unit}
          </span>
          {/* Stock indicator */}
          {stock > 0 && stock <= 5 && (
            <span className="text-amber-600">(Дуусах дөхсөн)</span>
          )}
        </div>

        {/* Add to cart button */}
        <Button
          size="sm"
          className={cn(
            "mt-2 h-[44px] w-full gap-2 text-sm",
            isOutOfStock && "pointer-events-none opacity-50",
          )}
          disabled={isOutOfStock}
          onClick={handleAddToCart}
        >
          <ShoppingCart className="size-4" weight="bold" />
          {isOutOfStock ? "Дууссан" : "Нэмэх"}
        </Button>
      </CardContent>
    </Card>
  );
}
