"use client";

import type { ShopProductRow } from "@/app/lib/data-shop";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ProductCard } from "./product-card";

interface ShopCatalogueClientProps {
  products: ShopProductRow[];
}

export function ShopCatalogueClient({ products }: ShopCatalogueClientProps) {
  if (products.length === 0) {
    return (
      <Empty>
        <EmptyMedia variant="icon" />
        <EmptyHeader>
          <EmptyTitle>Бараа байхгүй байна</EmptyTitle>
          <EmptyDescription>
            Та удахгүй шинэ бүтээгдэхүүн нэмэгдэхийг хүлээнэ үү
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
