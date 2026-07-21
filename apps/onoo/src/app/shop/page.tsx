import { Suspense } from "react";
import { getShopProducts } from "@/app/lib/data-shop";
import { ShopCatalogueClient } from "./components/shop-catalogue-client";
import { ShopPageSkeleton } from "./components/shop-skeleton";

export const instant = false;

export const metadata = {
  title: "Дэлгүүр | Onoo",
  description: "Onoo брэндийн бүтээгдэхүүн худалдан авах",
};

export default async function ShopPage() {
  const products = await getShopProducts();

  return (
    <div className="min-h-screen">
      <section className="border-b bg-gradient-to-b from-background to-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Onoo дэлгүүр
          </h1>
          <p className="mt-2 text-muted-foreground">
            Сагсан бөмбөгийн хэрэгсэл, Onoo брэндийн бүтээгдэхүүн
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <Suspense fallback={<ShopPageSkeleton />}>
          <ShopCatalogueClient products={products} />
        </Suspense>
      </section>
    </div>
  );
}
