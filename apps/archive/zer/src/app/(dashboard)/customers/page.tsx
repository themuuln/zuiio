import { Users } from "@phosphor-icons/react/dist/ssr";
import { withDbCapture } from "@zuiio/capture";
import { Suspense } from "react";
import {
  type CustomerRow,
  CustomersTable,
} from "@/components/customers/customers-table";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { ExportButton } from "@/components/erp/export-button";
import { PageShell } from "@/components/erp/page-shell";
import { DynamicCustomerCreateDrawer } from "@/lib/dynamic-drawers";
import { requireAppContext } from "@/lib/erp";

function PageSkeleton() {
  return (
    <PageShell
      title="Харилцагчид"
      description="Авлага, холбоо барих мэдээлэл, худалдан авагчийн баазаа удирдана."
    >
      <div className="h-96 animate-pulse rounded-xl bg-muted" />
    </PageShell>
  );
}

async function DataFetcher() {
  const { supabase, organizationId } = await requireAppContext();

  // Check org setting — hide balance column if credit tracking disabled
  const { data: org } = await withDbCapture(
    "page:customers organizations",
    supabase
      .from("organizations")
      .select("has_customer_credit")
      .eq("id", organizationId)
      .single(),
  );

  const showBalance =
    (org as { has_customer_credit: boolean } | null)?.has_customer_credit !==
    false;

  const { data: customers } = await withDbCapture(
    "page:customers contacts",
    supabase
      .from("contacts")
      .select("id, name, phone, email, address, balance")
      .eq("organization_id", organizationId)
      .eq("type", "customer")
      .order("created_at", { ascending: false })
      .limit(500),
  );

  const tableData: CustomerRow[] =
    customers?.map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      balance: customer.balance,
    })) ?? [];

  return (
    <PageShell
      title="Харилцагчид"
      description="Авлага, холбоо барих мэдээлэл, худалдан авагчийн баазаа удирдана."
      actions={
        <>
          <ExportButton
            href="/api/export/customers"
            filename={`customers-${new Date().toISOString().slice(0, 10)}.csv`}
          />
          <DynamicCustomerCreateDrawer />
        </>
      }
    >
      {!customers?.length ? (
        <ErpEmptyState
          icon={<Users className="size-4" />}
          title="Харилцагч бүртгэгдээгүй"
          description="Харилцагч бүртгэж, борлуулалтын урсгалд ашиглана."
          action={<DynamicCustomerCreateDrawer />}
        />
      ) : (
        <CustomersTable data={tableData} showBalance={showBalance} />
      )}
    </PageShell>
  );
}

export default async function CustomersPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DataFetcher />
    </Suspense>
  );
}
