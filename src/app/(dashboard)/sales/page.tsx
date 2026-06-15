import { Receipt } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { ErpEmptyState } from "@/components/erp/empty-state";
import { ExportButton } from "@/components/erp/export-button";
import { PageShell } from "@/components/erp/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAppContext } from "@/lib/erp";
import { type SaleRow, SalesTable } from "./sales-table";

export default async function SalesPage() {
  const { supabase, organizationId } = await requireAppContext();

  const { data: sales } = await supabase
    .from("sales")
    .select(
      "id, total_amount, paid_amount, sale_date, status, payment_method, contacts(name)",
    )
    .eq("organization_id", organizationId)
    .order("sale_date", { ascending: false });

  const tableData: SaleRow[] =
    sales?.map((sale) => ({
      id: sale.id,
      sale_date: sale.sale_date,
      contact_name: (sale.contacts as { name: string } | null)?.name ?? null,
      total_amount: sale.total_amount,
      paid_amount: sale.paid_amount,
      status: sale.status,
      payment_method: sale.payment_method,
    })) ?? [];

  return (
    <PageShell
      title="Борлуулалт"
      description="Борлуулалтын жагсаалт, статус, төлбөрийн мэдээлэл."
      actions={
        <>
          <ExportButton
            href="/api/export/sales"
            filename={`sales-${new Date().toISOString().slice(0, 10)}.csv`}
          />
          <Button asChild size="sm">
            <Link href="/sales/new">Шинэ борлуулалт</Link>
          </Button>
        </>
      }
    >
      {!sales?.length ? (
        <ErpEmptyState
          icon={<Receipt className="size-4" />}
          title="Борлуулалт бүртгэгдээгүй"
          description="Шинэ борлуулалт үүсгэж, борлуулалтын мэдээллээ хянана уу."
          action={
            <Button asChild size="sm">
              <Link href="/sales/new">Шинэ борлуулалт</Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Борлуулалтын жагсаалт</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesTable data={tableData} />
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
