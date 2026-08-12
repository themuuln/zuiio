import { withDbCapture } from "@zuiio/capture";
import { Suspense } from "react";
import { PageShell } from "@/components/erp/page-shell";
import type { PosCategory } from "@/components/pos/pos-product-grid";
import {
  type PosOpenSession,
  PosRegister,
} from "@/components/pos/pos-register";
import { requireAppContext } from "@/lib/erp";
import type { PosProduct } from "@/lib/pos";

/** Skeleton shown while POS data streams in (PPR: shell stays put). */
function PosSkeleton() {
  return (
    <PageShell title="Касс" loading>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={`pos-skeleton-${i + 1}`}
              className="h-28 animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
        <div className="hidden h-96 animate-pulse rounded-xl bg-muted lg:block" />
      </div>
    </PageShell>
  );
}

/** Fetches the register's product catalog, categories, and org settings. */
async function PosDataFetcher() {
  const { supabase, organizationId } = await requireAppContext();

  const [productsResult, categoriesResult, orgResult, sessionResult] =
    await Promise.all([
      withDbCapture(
        "page:pos:products",
        supabase
          .from("products")
          .select(
            "id, name, sale_price, current_stock, unit, barcode, sku, category_id, image_url, has_variants",
          )
          .eq("organization_id", organizationId)
          .is("deleted_at", null)
          .order("name", { ascending: true })
          .limit(1000),
      ),
      withDbCapture(
        "page:pos:categories",
        supabase
          .from("categories")
          .select("id, name")
          .eq("organization_id", organizationId)
          .order("name", { ascending: true }),
      ),
      // has_receipt_printer is not yet in the generated types — cast the
      // table name like the sales page does for the same column.
      withDbCapture(
        "page:pos:org",
        supabase
          .from("organizations" as never)
          .select("has_receipt_printer")
          .eq("id" as never, organizationId)
          .single(),
      ),
      // Open cash session (register name joined for the banner chip).
      withDbCapture(
        "page:pos:session",
        supabase
          .from("cash_sessions")
          .select("id, register_id, cash_registers(name)")
          .eq("organization_id", organizationId)
          .eq("status", "open")
          .limit(1),
      ),
    ]);

  const products: PosProduct[] = (productsResult.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    sale_price: p.sale_price,
    current_stock: p.current_stock,
    unit: p.unit,
    barcode: p.barcode,
    sku: p.sku,
    categoryId: p.category_id,
    image_url: p.image_url,
    has_variants: p.has_variants,
  }));

  const categories: PosCategory[] = (categoriesResult.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
  }));

  const hasReceiptPrinter =
    (
      orgResult.data as unknown as {
        has_receipt_printer: boolean | null;
      } | null
    )?.has_receipt_printer === true;

  const openSessionRow = sessionResult.data?.[0] as
    | {
        id: string;
        register_id: string | null;
        cash_registers: { name: string | null } | null;
      }
    | undefined;

  const openSession: PosOpenSession | null = openSessionRow
    ? {
        id: openSessionRow.id,
        registerName: openSessionRow.cash_registers?.name ?? null,
      }
    : null;

  return (
    <PageShell title="Касс">
      <PosRegister
        products={products}
        categories={categories}
        openSession={openSession}
        hasReceiptPrinter={hasReceiptPrinter}
      />
    </PageShell>
  );
}

export default async function PosPage() {
  return (
    <Suspense fallback={<PosSkeleton />}>
      <PosDataFetcher />
    </Suspense>
  );
}
