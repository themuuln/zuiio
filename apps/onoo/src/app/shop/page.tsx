import { ShoppingBag } from "lucide-react";
import { Suspense } from "react";
import { getShopProducts } from "@/app/lib/data-shop";
import { Badge } from "@/components/ui/badge";
import { ShopCatalogueClient } from "./components/shop-catalogue-client";
import { ShopPageSkeleton } from "./components/shop-skeleton";

export const metadata = {
  title: "Дэлгүүр | Onoo",
  description: "Onoo брэндийн бүтээгдэхүүн худалдан авах",
};

// ISR — products change infrequently, background revalidate every 5 min
export const revalidate = 300;

export default async function ShopPage() {
  const products = await getShopProducts();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      {/* Header row */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Брэндийн дэлгүүр
        </p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
              Onoo дэлгүүр
            </h1>
            <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
              Сагсан бөмбөгийн хэрэгсэл, Onoo брэндийн бүтээгдэхүүн
            </p>
          </div>
          {products.length > 0 && (
            <Badge variant="secondary" className="shrink-0 gap-1.5">
              <ShoppingBag className="size-3.5" aria-hidden="true" />
              {products.length} бүтээгдэхүүн
            </Badge>
          )}
        </div>
      </div>

      {/* Products grid */}
      <Suspense fallback={<ShopPageSkeleton />}>
        <ShopCatalogueClient products={products} />
      </Suspense>
    </main>
  );
}
