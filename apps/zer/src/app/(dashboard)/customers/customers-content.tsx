"use client";

import { Users } from "@phosphor-icons/react/dist/ssr";
import { useQuery } from "@tanstack/react-query";
import { withDbCapture } from "@zuiio/capture";
import type { CustomerRow } from "@/components/customers/customers-table";
import { CustomersTable } from "@/components/customers/customers-table";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { ExportButton } from "@/components/erp/export-button";
import { PageShell } from "@/components/erp/page-shell";
import { DynamicCustomerCreateDrawer } from "@/lib/dynamic-drawers";
import { useOrgSettings } from "@/lib/org-settings-context";
import { createClient } from "@/lib/supabase/client";

export function CustomersContent() {
  const { organizationId, hasCustomerCredit } = useOrgSettings();

  const { data: customers, isLoading } = useQuery({
    queryKey: ["customers", "list", organizationId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await withDbCapture(
        "page:customers contacts",
        supabase
          .from("contacts")
          .select("id, name, phone, email, address, balance")
          .eq("organization_id", organizationId)
          .eq("type", "customer")
          .order("created_at", { ascending: false })
          .limit(500),
      );
      if (error) throw error;
      return (data ?? []).map((customer) => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        balance: customer.balance,
      })) as CustomerRow[];
    },
    enabled: !!organizationId,
  });

  const showBalance = hasCustomerCredit !== false;

  return (
    <PageShell
      title="Харилцагчид"
      description="Авлага, холбоо барих мэдээлэл, худалдан авагчийн баазаа удирдана."
    >
      {(customers && customers.length > 0) || isLoading ? (
        <CustomersTable
          data={customers ?? []}
          showBalance={showBalance}
          loading={isLoading}
          toolbar={
            <>
              <ExportButton
                href="/api/export/customers"
                filename={`customers-${new Date().toISOString().slice(0, 10)}.csv`}
              />
              <DynamicCustomerCreateDrawer />
            </>
          }
        />
      ) : (
        <ErpEmptyState
          icon={<Users className="size-4" />}
          title="Харилцагч бүртгэгдээгүй"
          description="Харилцагч бүртгэж, борлуулалтын урсгалд ашиглана."
          action={<DynamicCustomerCreateDrawer />}
        />
      )}
    </PageShell>
  );
}
