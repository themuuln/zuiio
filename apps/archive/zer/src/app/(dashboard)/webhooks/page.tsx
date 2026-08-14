import { withDbCapture } from "@zuiio/capture";
import { Suspense } from "react";
import { requireAppContext } from "@/lib/erp";
import { WEBHOOK_EVENT_TYPES } from "@/lib/webhooks";
import { WebhooksContent } from "./webhooks-content";

function PageSkeleton() {
  return <div className="h-96 animate-pulse rounded-xl bg-muted" />;
}

async function DataFetcher() {
  const { supabase, organizationId } = await requireAppContext();

  const { data: webhooks } = await withDbCapture(
    "page:webhooks subscriptions",
    supabase
      .from("webhook_subscriptions")
      .select(
        "id, name, url, secret, event_types, is_active, created_at, updated_at",
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
  );

  // Recent delivery counts per subscription
  const webhookIds = (webhooks ?? []).map((w) => w.id);
  let deliveryCounts: Record<string, { total: number; failed: number }> = {};
  if (webhookIds.length > 0) {
    const { data: deliveries } = await withDbCapture(
      "page:webhooks delivery counts",
      supabase
        .from("webhook_deliveries")
        .select("subscription_id, status")
        .in("subscription_id", webhookIds),
    );
    deliveryCounts = {};
    for (const d of deliveries ?? []) {
      const existing = deliveryCounts[d.subscription_id];
      const entry = existing ?? { total: 0, failed: 0 };
      deliveryCounts[d.subscription_id] = entry;
      entry.total += 1;
      if (d.status === "failed") entry.failed += 1;
    }
  }

  const webhookRows: WebhookRow[] = (webhooks ?? []).map((w) => ({
    id: w.id,
    name: w.name,
    url: w.url,
    secret: w.secret,
    event_types: (w.event_types ?? []) as string[],
    is_active: w.is_active,
    created_at: w.created_at ?? new Date().toISOString(),
    updated_at: w.updated_at,
    delivery_count: deliveryCounts[w.id]?.total ?? 0,
    failed_count: deliveryCounts[w.id]?.failed ?? 0,
  }));

  return (
    <WebhooksContent
      webhooks={webhookRows}
      eventTypes={[...WEBHOOK_EVENT_TYPES]}
    />
  );
}

export type WebhookRow = {
  id: string;
  name: string;
  url: string;
  secret: string | null;
  event_types: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  delivery_count: number;
  failed_count: number;
};

export default async function WebhooksPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DataFetcher />
    </Suspense>
  );
}
