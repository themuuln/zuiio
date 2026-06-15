"use client";

import { ShoppingCart } from "@phosphor-icons/react";
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
  barcode: string | null;
  category_id: string | null;
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

  return (
    <Card
      className={cn(
        "flex flex-col gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md",
        isOutOfStock && "opacity-60",
      )}
    >
      {/* Top section: placeholder image area */}
      <div
        className={cn(
          "flex aspect-square items-center justify-center bg-muted/30",
          isOutOfStock && "bg-muted/10",
        )}
      >
        {isOutOfStock ? (
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
