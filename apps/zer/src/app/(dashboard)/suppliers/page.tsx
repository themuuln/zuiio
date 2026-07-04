import { Buildings } from "@phosphor-icons/react/dist/ssr";
import { redirect } from "next/navigation";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { ExportButton } from "@/components/erp/export-button";
import { PageShell } from "@/components/erp/page-shell";
import { SupplierCreateDrawer } from "@/components/suppliers/supplier-create-drawer";
import {
  type SupplierRow,
  SuppliersTable,
} from "@/components/suppliers/suppliers-table";
import { requireAppContext } from "@/lib/erp";

export default async function SuppliersPage() {
  const { supabase, organizationId } = await requireAppContext();

  // Check org setting — redirect if suppliers are not used
  const { data: org } = await supabase
    .from("organizations")
    .select("has_suppliers")
    .eq("id", organizationId)
    .single();

  const hasSuppliers =
    (org as { has_suppliers: boolean } | null)?.has_suppliers !== false;
  if (!hasSuppliers) redirect("/");

  const { data: suppliers } = await supabase
    .from("contacts")
    .select("id, name, phone, email, address, balance")
    .eq("organization_id", organizationId)
    .eq("type", "supplier")
    .order("created_at", { ascending: false });

  const tableData: SupplierRow[] =
    suppliers?.map((supplier) => ({
      id: supplier.id,
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      balance: supplier.balance,
    })) ?? [];

  return (
    <PageShell
      title="Нийлүүлэгчид"
      description="Импорт, ханган нийлүүлэлтийн эх үүсвэр, өглөгийн үлдэгдлээ хянах төв."
      actions={
        <>
          <ExportButton
            href="/api/export/suppliers"
            filename={`suppliers-${new Date().toISOString().slice(0, 10)}.csv`}
          />
          <SupplierCreateDrawer />
        </>
      }
    >
      {!suppliers?.length ? (
        <ErpEmptyState
          icon={<Buildings className="size-4" />}
          title="Нийлүүлэгч бүртгэгдээгүй"
          description="Нийлүүлэгч бүртгэж, барааны орлогын урсгалд ашиглана."
          action={<SupplierCreateDrawer />}
        />
      ) : (
        <SuppliersTable data={tableData} />
      )}
    </PageShell>
  );
}
