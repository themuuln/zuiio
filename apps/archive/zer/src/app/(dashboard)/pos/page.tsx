import { Suspense } from "react";
import { PageShell } from "@/components/erp/page-shell";
import { PosRegister } from "@/components/pos/pos-register";
import { loadPosRegisterData } from "@/lib/pos-server";

/** Static skeleton tile keys — stable across renders, not array indices. */
const POS_SKELETON_KEYS = Array.from({ length: 10 }, (_, i) => i + 1);

/** Skeleton shown while POS data streams in (PPR: shell stays put). */
function PosSkeleton() {
  return (
    <PageShell title="Касс" loading>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {POS_SKELETON_KEYS.map((n) => (
            <div
              key={`pos-skeleton-${n}`}
              className="h-28 animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
        <div className="hidden h-96 animate-pulse rounded-xl bg-muted lg:block" />
      </div>
    </PageShell>
  );
}

/** Fetches the register's catalog, categories, session, and org settings. */
async function PosDataFetcher() {
  const data = await loadPosRegisterData();

  return (
    <PageShell title="Касс">
      <PosRegister
        products={data.products}
        categories={data.categories}
        openSession={data.openSession}
        hasReceiptPrinter={data.hardware.hasReceiptPrinter}
        hasCashDrawer={data.hardware.hasCashDrawer}
        escposEnabled={data.hardware.escposEnabled}
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
