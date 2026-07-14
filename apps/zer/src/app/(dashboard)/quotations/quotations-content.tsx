"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { FileText } from "@phosphor-icons/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { QuotationCreateDrawer } from "@/components/quotations/quotation-create-drawer";
import { QuotationDetailDrawer } from "@/components/quotations/quotation-detail-drawer";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { currencyColumn, dateColumn, textColumn } from "@/lib/table-columns";
import type { QuotationRow } from "./page";

const STATUS_LABELS: Record<string, string> = {
  draft: "Ноорог",
  sent: "Илгээсэн",
  accepted: "Хүлээн зөвшөөрсөн",
  rejected: "Татгалзсан",
  expired: "Хугацаа дууссан",
  converted: "Борлуулалт болсон",
};

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "secondary",
  sent: "outline",
  accepted: "default",
  rejected: "destructive",
  expired: "outline",
  converted: "default",
};
const columns: ColumnDef<QuotationRow>[] = [
  {
    accessorKey: "quote_number",
    header: "Дугаар",
  },
  dateColumn("issue_date", "Огноо"),
  textColumn("contact_name", "Харилцагч"),
  currencyColumn("total_amount", "Нийт дүн"),
  {
    accessorFn: (row) => STATUS_LABELS[row.status] ?? row.status,
    id: "status",
    header: "Төлөв",
    cell: ({ row }) => (
      <Badge variant={STATUS_VARIANTS[row.original.status] ?? "outline"}>
        {STATUS_LABELS[row.original.status] ?? row.original.status}
      </Badge>
    ),
  },
  dateColumn("expiry_date", "Хүчинтэй"),
];

type ProductOption = {
  id: string;
  name: string;
  sale_price: number | null;
  current_stock: number | null;
  unit: string | null;
};

type CustomerOption = {
  id: string;
  name: string;
};

export function QuotationsContent({
  quotations,
  products,
  customers,
  loading = false,
}: {
  quotations: QuotationRow[];
  products: ProductOption[];
  customers: CustomerOption[];
  loading?: boolean;
}) {
  const searchParams = useSearchParams();
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(
    null,
  );
  const [createOpen, setCreateOpen] = useState(
    searchParams.get("create") === "true",
  );
  const initialCreateRef = useRef(createOpen);

  useEffect(() => {
    if (initialCreateRef.current) {
      window.history.replaceState({}, "", "/quotations");
    }
  }, []);

  return (
    <>
      <PageShell
        title="Үнийн санал"
        description="Үйлчлүүлэгчдэд өгөх үнийн саналууд"
        actions={
          <QuotationCreateDrawer
            customers={customers}
            products={products}
            open={createOpen}
            onOpenChange={setCreateOpen}
          />
        }
      >
        {loading ? (
          <DataTable
            columns={columns}
            data={[]}
            loading
            searchColumn="quote_number"
            searchPlaceholder="Хайх..."
            pageSize={10}
            totalLabel="үнийн санал"
            enableSorting
            enableColumnVisibility
          />
        ) : quotations.length === 0 ? (
          <ErpEmptyState
            icon={<FileText className="size-4" />}
            title="Үнийн санал байхгүй"
            description="Шинэ үнийн санал үүсгэж, үйлчлүүлэгчдэд илгээнэ үү."
            action={
              <button
                type="button"
                className={buttonVariants({ variant: "default" })}
                onClick={() => setCreateOpen(true)}
              >
                <FileText className="size-4" />
                Шинэ үнийн санал
              </button>
            }
          />
        ) : (
          <DataTable
            columns={columns}
            data={quotations}
            searchColumn="quote_number"
            searchPlaceholder="Хайх..."
            pageSize={10}
            totalLabel="үнийн санал"
            enableSorting
            enableColumnVisibility
            onRowClick={(row) => setSelectedQuotationId(row.id)}
          />
        )}
      </PageShell>
      <QuotationDetailDrawer
        quotationId={selectedQuotationId}
        onClose={() => setSelectedQuotationId(null)}
      />
    </>
  );
}
