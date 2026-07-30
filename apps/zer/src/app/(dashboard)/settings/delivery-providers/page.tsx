import { withDbCapture } from "@zuiio/capture";
import { Suspense } from "react";
import type { ProviderRow } from "./actions";
import { requireAppContext } from "@/lib/erp";
import { ProvidersContent } from "./providers-content";

function PageSkeleton() {
  return <div className="h-96 animate-pulse rounded-xl bg-muted" />;
}

async function DataFetcher() {
  const { supabase, organizationId } = await requireAppContext();

  const { data: providers } = await withDbCapture(
    "page:delivery-providers list",
    supabase
      .from("delivery_providers")
      .select("*")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true }),
  );

  const providerRows: ProviderRow[] = (providers ?? []).map(
    (p) => ({
      ...p,
      is_active: p.is_active ?? true,
      config: p.config as Record<string, unknown> | null,
      created_at: p.created_at ?? new Date().toISOString(),
    }),
  );

  return <ProvidersContent providers={providerRows} />;
}

export default async function DeliveryProvidersPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DataFetcher />
    </Suspense>
  );
}
