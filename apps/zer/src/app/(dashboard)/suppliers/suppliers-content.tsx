"use client";

import { Buildings } from "@phosphor-icons/react/dist/ssr";
import { useQuery } from "@tanstack/react-query";
import { withDbCapture } from "@zuiio/capture";
import { useEffect } from "react";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { ExportButton } from "@/components/erp/export-button";
import { PageShell } from "@/components/erp/page-shell";
import {
  type SupplierRow,
  SuppliersTable,
} from "@/components/suppliers/suppliers-table";
import { DynamicSupplierCreateDrawer } from "@/lib/dynamic-drawers";
import { useOrgSettings } from "@/lib/org-settings-context";
import { createClient } from "@/lib/supabase/client";

export function SuppliersContent() {
  const { organizationId, hasSuppliers } = useOrgSettings();

  const query = useQuery({
    queryKey: ["suppliers", "list", organizationId],
    queryFn: async () => {
      const supabase = createClient();
      const { data: suppliers } = await withDbCapture(
        "page:suppliers",
        supabase
          .from("contacts")
          .select("id, name, phone, email, address, balance")
          .eq("organization_id", organizationId)
          .eq("type", "supplier")
          .order("created_at", { ascending: false })
          .limit(500),
      );
      return (suppliers ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        phone: s.phone,
        email: s.email,
        address: s.address,
        balance: s.balance,
      })) as SupplierRow[];
    },
    enabled: !!organizationId,
  });

  const suppliers = query.data ?? [];
  const isLoading = query.isLoading || query.isFetching;

  // Redirect if suppliers feature is disabled
  useEffect(() => {
    if (!hasSuppliers) {
      window.location.href = "/";
    }
  }, [hasSuppliers]);

  // Don't render anything while redirecting
  if (!hasSuppliers) return null;

  return (
    <PageShell
      title="Нийлүүлэгчид"
      description="Импорт, ханган нийлүүлэлтийн эх үүсвэр, өглөгийн үлдэгдлээ хянах төв."
    >
      {!suppliers.length && !isLoading ? (
        <ErpEmptyState
          icon={<Buildings className="size-4" />}
          title="Нийлүүлэгч бүртгэгдээгүй"
          description="Нийлүүлэгч бүртгэж, барааны орлогын урсгалд ашиглана."
          action={<DynamicSupplierCreateDrawer />}
        />
      ) : (
        <SuppliersTable
          data={suppliers}
          loading={isLoading}
          toolbar={
            <>
              <ExportButton
                href="/api/export/suppliers"
                filename={`suppliers-${new Date().toISOString().slice(0, 10)}.csv`}
              />
              <DynamicSupplierCreateDrawer />
            </>
          }
        />
      )}
    </PageShell>
  );
}
