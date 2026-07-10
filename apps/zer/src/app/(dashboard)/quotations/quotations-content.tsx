"use client";

import { FileText } from "@phosphor-icons/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ErpDataTable } from "@/components/erp/data-table";
import { PageShell } from "@/components/erp/page-shell";
import { QuotationCreateDrawer } from "@/components/quotations/quotation-create-drawer";
import { QuotationDetailDrawer } from "@/components/quotations/quotation-detail-drawer";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";
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
        <ErpDataTable
          columns={[
            {
              header: "Дугаар",
              accessor: (row: QuotationRow) => row.quote_number,
              cellClassName: "font-medium",
            },
            {
              header: "Огноо",
              accessor: (row: QuotationRow) => formatDate(row.issue_date),
            },
            {
              header: "Харилцагч",
              accessor: (row: QuotationRow) => row.contact_name ?? "-",
            },
            {
              header: "Нийт дүн",
              accessor: (row: QuotationRow) => formatCurrency(row.total_amount),
              className: "text-right",
            },
            {
              header: "Төлөв",
              accessor: (row: QuotationRow) => (
                <Badge variant={STATUS_VARIANTS[row.status] ?? "outline"}>
                  {STATUS_LABELS[row.status] ?? row.status}
                </Badge>
              ),
            },
            {
              header: "Хүчинтэй",
              accessor: (row: QuotationRow) =>
                row.expiry_date ? formatDate(row.expiry_date) : "-",
            },
          ]}
          data={quotations}
          loading={loading}
          keyExtractor={(row) => row.id}
          onRowClick={(row) => setSelectedQuotationId(row.id)}
          emptyState={{
            icon: <FileText className="size-4" />,
            title: "Үнийн санал байхгүй",
            description: "Шинэ үнийн санал үүсгэж, үйлчлүүлэгчдэд илгээнэ үү.",
            action: (
              <button
                type="button"
                className={buttonVariants({ variant: "default" })}
                onClick={() => setCreateOpen(true)}
              >
                <FileText className="size-4" />
                Шинэ үнийн санал
              </button>
            ),
          }}
        />
      </PageShell>
      <QuotationDetailDrawer
        quotationId={selectedQuotationId}
        onClose={() => setSelectedQuotationId(null)}
      />
    </>
  );
}
