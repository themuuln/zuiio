import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getCompanyTypeLabel } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

type PublicProductData = {
  organization: {
    name: string;
    slug: string;
    currency: string;
    companyType: string;
  };
  product: {
    id: string;
    name: string;
    sku: string | null;
    barcode: string | null;
    unit: string | null;
    cost_price: number | null;
    sale_price: number | null;
    current_stock: number | null;
    min_stock: number | null;
    category_name: string | null;
    created_at: string | null;
  };
};

export default async function PublicProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_public_product", {
    p_slug: slug,
    p_product_id: id,
  });

  if (error || !data) {
    console.error("Public product error:", error ?? "Product not found");
    notFound();
  }

  const { organization, product } = data as unknown as PublicProductData;
  const stock = Number(product.current_stock ?? 0);
  const minStock = Number(product.min_stock ?? 0);
  const isLow = stock > 0 && stock <= minStock;
  const isOut = stock <= 0;

  return (
    <div className="mx-auto min-h-dvh max-w-3xl space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Back link */}
      <Link
        href={`/${slug}/products`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Бараа руу буцах
      </Link>

      {/* Org header */}
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {getCompanyTypeLabel(organization.companyType)} &middot;{" "}
          {organization.name}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {product.name}
        </h1>
        {product.category_name && (
          <Badge variant="outline">{product.category_name}</Badge>
        )}
      </div>

      {/* Price + stock card */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border/80 bg-card/80 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Үнэ
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight">
            {formatCurrency(Number(product.sale_price ?? 0))}
          </p>
          {product.cost_price != null && Number(product.cost_price) > 0 && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Өртөг: {formatCurrency(Number(product.cost_price))}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-border/80 bg-card/80 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Нөөц
          </p>
          <p
            className={`mt-1 text-3xl font-bold tracking-tight ${
              isOut
                ? "text-destructive"
                : isLow
                  ? "text-amber-600"
                  : "text-emerald-600"
            }`}
          >
            {stock} {product.unit ?? "ширхэг"}
          </p>
          {minStock > 0 && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Доод түвшин: {minStock} {product.unit ?? "ширхэг"}
            </p>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="rounded-xl border border-border/80 bg-card/80 p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Дэлгэрэнгүй
        </h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
          {product.sku && (
            <>
              <dt className="text-muted-foreground">SKU</dt>
              <dd className="font-medium">{product.sku}</dd>
            </>
          )}
          {product.barcode && (
            <>
              <dt className="text-muted-foreground">Barcode</dt>
              <dd className="font-medium font-mono">{product.barcode}</dd>
            </>
          )}
          {product.unit && (
            <>
              <dt className="text-muted-foreground">Нэгж</dt>
              <dd className="font-medium">{product.unit}</dd>
            </>
          )}
          {product.category_name && (
            <>
              <dt className="text-muted-foreground">Ангилал</dt>
              <dd className="font-medium">{product.category_name}</dd>
            </>
          )}
          {product.created_at && (
            <>
              <dt className="text-muted-foreground">Бүртгэсэн</dt>
              <dd className="font-medium">{formatDate(product.created_at)}</dd>
            </>
          )}
        </dl>
      </div>

      {/* Footer */}
      <div className="border-t pt-6 text-center text-xs text-muted-foreground">
        Zer ERP &middot; {organization.name} &middot; Нээлттэй мэдээлэл
      </div>
    </div>
  );
}
