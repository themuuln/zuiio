import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PageShell } from "@/components/erp/page-shell";
import { requireAppContext } from "@/lib/erp";
import { checkOrgSetting } from "@/lib/org-settings";
import { listDeliveries } from "./actions";
import { DeliveriesContent } from "./deliveries-content";

function PageSkeleton() {
  return (
    <PageShell title="Хүргэлт" description="Захиалгын хүргэлтийн бүртгэл, хяналт">
      <div className="h-96 animate-pulse rounded-xl bg-muted" />
    </PageShell>
  );
}

async function DataFetcher() {
  const deliveries = await listDeliveries();

  return <DeliveriesContent deliveries={deliveries} />;
}

export default async function DeliveriesPage() {
  const { supabase, organizationId } = await requireAppContext();
  if (
    !(await checkOrgSetting(supabase, organizationId, "has_delivery_tracking"))
  )
    redirect("/");

  return (
    <Suspense fallback={<PageSkeleton />}>
      <DataFetcher />
    </Suspense>
  );
}
