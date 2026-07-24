"use client";

import { FileText } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { InvoiceCreateDrawer } from "@/components/invoices/invoice-create-drawer";
import { InvoiceDetailDrawer } from "@/components/invoices/invoice-detail-drawer";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency } from "@/lib/format";
import { dateColumn, textColumn } from "@/lib/table-columns";

type ProductOption = {
  id: string;
  name: string;
  sale_price: number | null;
  current_stock: number | null;
  unit: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Хүлээгдэж буй",
  paid: "Төлөгдсөн",
  partially_paid: "Хэсэгчилсэн",
  overdue: "Хугацаа хэтэрсэн",
  cancelled: "Цуцлагдсан",
};

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  paid: "default",
  partially_paid: "outline",
  overdue: "destructive",
  cancelled: "outline",
};

export type InvoiceRow = {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string | null;
  contact_name: string | null;
  total_amount: number;
  paid_amount: number;
  status: string | null;
};

const columns: ColumnDef<InvoiceRow>[] = [
  {
    accessorKey: "invoice_number",
    header: "Дугаар",
  },
  dateColumn("issue_date", "Огноо"),
  dateColumn("due_date", "Дуусах хугацаа"),
  textColumn("contact_name", "Харилцагч"),
  {
    accessorKey: "total_amount",
    header: "Дүн",
    cell: ({ row }) => (
      <span className="text-right">
        {formatCurrency(row.original.total_amount)}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Төлөв",
    cell: ({ row }) => (
      <Badge variant={STATUS_VARIANTS[row.original.status ?? ""] ?? "outline"}>
        {STATUS_LABELS[row.original.status ?? ""] ?? row.original.status}
      </Badge>
    ),
  },
];

export function InvoicesContent({
  invoiceRows,
  contacts,
  products,
  loading,
}: {
  invoiceRows: InvoiceRow[];
  contacts: Array<{ id: string; name: string }>;
  products: ProductOption[];
  /** Inline skeleton rows while data is loading */
  loading?: boolean;
}) {
  const searchParams = useSearchParams();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
    null,
  );
  const [createOpen, setCreateOpen] = useState(
    searchParams.get("create") === "true",
  );
  const initialCreateRef = useRef(createOpen);

  useEffect(() => {
    if (initialCreateRef.current) {
      // Replace URL to remove ?create=true without navigation
      window.history.replaceState({}, "", "/invoices");
    }
  }, []);

  if (!loading && invoiceRows.length === 0) {
    return (
      <>
        <PageShell
          title="Нэхэмжлэл"
          description="Борлуулалтын нэхэмжлэлүүд"
          actions={
            <InvoiceCreateDrawer
              contacts={contacts}
              products={products}
              open={createOpen}
              onOpenChange={setCreateOpen}
            />
          }
        >
          <ErpEmptyState
            icon={<FileText className="size-4" />}
            title="Нэхэмжлэл байхгүй"
            description="Шинэ нэхэмжлэл үүсгэж, харилцагчдад хуваалцах холбоос илгээнэ үү."
            action={
              <button
                type="button"
                className={buttonVariants({ variant: "default" })}
                onClick={() => setCreateOpen(true)}
              >
                <FileText className="size-4" />
                Шинэ нэхэмжлэл
              </button>
            }
          />
        </PageShell>
        <InvoiceDetailDrawer
          invoiceId={selectedInvoiceId}
          onClose={() => setSelectedInvoiceId(null)}
        />
      </>
    );
  }

  return (
    <>
      <PageShell
        title="Нэхэмжлэл"
        description="Борлуулалтын нэхэмжлэлүүд"
        actions={
          <InvoiceCreateDrawer
            contacts={contacts}
            products={products}
            open={createOpen}
            onOpenChange={setCreateOpen}
          />
        }
      >
        <DataTable
          columns={columns}
          data={invoiceRows}
          loading={loading}
          onRowClick={(row) => setSelectedInvoiceId(row.id)}
          searchColumn="invoice_number"
          searchPlaceholder="Хайх..."
          totalLabel="нэхэмжлэл"
          enableSorting
          enableColumnVisibility
        />
      </PageShell>
      <InvoiceDetailDrawer
        invoiceId={selectedInvoiceId}
        onClose={() => setSelectedInvoiceId(null)}
      />
    </>
  );
}
