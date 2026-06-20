"use client";

import { FileText } from "@phosphor-icons/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { QuotationCreateDrawer } from "@/components/quotations/quotation-create-drawer";
import { QuotationDetailDrawer } from "@/components/quotations/quotation-detail-drawer";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
}: {
  quotations: QuotationRow[];
  products: ProductOption[];
  customers: CustomerOption[];
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
        {!quotations.length ? (
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
          <Card>
            <CardHeader>
              <CardTitle>Үнийн саналууд</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дугаар</TableHead>
                    <TableHead>Огноо</TableHead>
                    <TableHead>Харилцагч</TableHead>
                    <TableHead className="text-right">Нийт дүн</TableHead>
                    <TableHead>Төлөв</TableHead>
                    <TableHead>Хүчинтэй</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotations.map((q) => (
                    <TableRow
                      key={q.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedQuotationId(q.id)}
                    >
                      <TableCell className="font-medium">
                        {q.quote_number}
                      </TableCell>
                      <TableCell>{formatDate(q.issue_date)}</TableCell>
                      <TableCell>{q.contact_name ?? "-"}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(q.total_amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[q.status] ?? "outline"}>
                          {STATUS_LABELS[q.status] ?? q.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {q.expiry_date ? formatDate(q.expiry_date) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </PageShell>
      <QuotationDetailDrawer
        quotationId={selectedQuotationId}
        onClose={() => setSelectedQuotationId(null)}
      />
    </>
  );
}
