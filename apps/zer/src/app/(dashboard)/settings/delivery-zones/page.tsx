import { withDbCapture } from "@zuiio/capture";
import { Suspense } from "react";
import { requireAppContext } from "@/lib/erp";
import { ZonesContent } from "./zones-content";

function PageSkeleton() {
  return <div className="h-96 animate-pulse rounded-xl bg-muted" />;
}

async function DataFetcher() {
  const { supabase, organizationId } = await requireAppContext();

  const { data: zones } = await withDbCapture(
    "page:delivery-zones list",
    supabase
      .from("delivery_zones")
      .select(
        "id, name, description, base_fee, free_delivery_threshold, estimated_delivery_minutes, is_active, sort_order, created_at",
      )
      .eq("organization_id", organizationId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
  );

  const zoneRows: import("./actions").ZoneRow[] = (zones ?? []).map((z) => ({
    ...z,
    is_active: z.is_active ?? true,
    sort_order: z.sort_order ?? 0,
    created_at: z.created_at ?? new Date().toISOString(),
  }));

  return <ZonesContent zones={zoneRows} />;
}

export default async function DeliveryZonesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DataFetcher />
    </Suspense>
  );
}
