"use client";

import { FileText } from "@phosphor-icons/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { type Column, ErpDataTable } from "@/components/erp/data-table";
import { PageShell } from "@/components/erp/page-shell";
import { InvoiceCreateDrawer } from "@/components/invoices/invoice-create-drawer";
import { InvoiceDetailDrawer } from "@/components/invoices/invoice-detail-drawer";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";

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

const columns: Column<InvoiceRow>[] = [
  {
    header: "Дугаар",
    accessor: (row) => row.invoice_number,
  },
  {
    header: "Огноо",
    accessor: (row) => formatDate(row.issue_date),
  },
  {
    header: "Дуусах хугацаа",
    accessor: (row) => (row.due_date ? formatDate(row.due_date) : "-"),
  },
  {
    header: "Харилцагч",
    accessor: (row) => row.contact_name ?? "-",
  },
  {
    header: "Дүн",
    accessor: (row) => formatCurrency(row.total_amount),
    cellClassName: "text-right",
  },
  {
    header: "Төлөв",
    accessor: (row) => (
      <Badge variant={STATUS_VARIANTS[row.status ?? ""] ?? "outline"}>
        {STATUS_LABELS[row.status ?? ""] ?? row.status}
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
        <ErpDataTable
          title="Нэхэмжлэлийн жагсаалт"
          columns={columns}
          data={invoiceRows}
          loading={loading}
          keyExtractor={(row) => row.id}
          onRowClick={(row) => setSelectedInvoiceId(row.id)}
          emptyState={{
            icon: <FileText className="size-4" />,
            title: "Нэхэмжлэл байхгүй",
            description:
              "Шинэ нэхэмжлэл үүсгэж, харилцагчдад хуваалцах холбоос илгээнэ үү.",
            action: (
              <button
                type="button"
                className={buttonVariants({ variant: "default" })}
                onClick={() => setCreateOpen(true)}
              >
                <FileText className="size-4" />
                Шинэ нэхэмжлэл
              </button>
            ),
          }}
        />
      </PageShell>
      <InvoiceDetailDrawer
        invoiceId={selectedInvoiceId}
        onClose={() => setSelectedInvoiceId(null)}
      />
    </>
  );
}
