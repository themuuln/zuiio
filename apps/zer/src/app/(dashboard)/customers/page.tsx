import { Users } from "@phosphor-icons/react/dist/ssr";
import { CustomerCreateDrawer } from "@/components/customers/customer-create-drawer";
import {
  type CustomerRow,
  CustomersTable,
} from "@/components/customers/customers-table";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { ExportButton } from "@/components/erp/export-button";
import { PageShell } from "@/components/erp/page-shell";
import { requireAppContext } from "@/lib/erp";

export default async function CustomersPage() {
  const { supabase, organizationId } = await requireAppContext();

  // Check org setting — hide balance column if credit tracking disabled
  const { data: org } = await supabase
    .from("organizations")
    .select("has_customer_credit")
    .eq("id", organizationId)
    .single();

  const showBalance =
    (org as { has_customer_credit: boolean } | null)?.has_customer_credit !==
    false;

  const { data: customers } = await supabase
    .from("contacts")
    .select("id, name, phone, email, address, balance")
    .eq("organization_id", organizationId)
    .eq("type", "customer")
    .order("created_at", { ascending: false });

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
          <CustomerCreateDrawer />
        </>
      }
    >
      {!customers?.length ? (
        <ErpEmptyState
          icon={<Users className="size-4" />}
          title="Харилцагч бүртгэгдээгүй"
          description="Харилцагч бүртгэж, борлуулалтын урсгалд ашиглана."
          action={<CustomerCreateDrawer />}
        />
      ) : (
        <CustomersTable data={tableData} showBalance={showBalance} />
      )}
    </PageShell>
  );
}
