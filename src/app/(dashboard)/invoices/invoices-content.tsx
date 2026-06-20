"use client";

import { FileText } from "@phosphor-icons/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { InvoiceCreateDrawer } from "@/components/invoices/invoice-create-drawer";
import { InvoiceDetailDrawer } from "@/components/invoices/invoice-detail-drawer";
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

export function InvoicesContent({
  invoiceRows,
  contacts,
  products,
}: {
  invoiceRows: InvoiceRow[];
  contacts: Array<{ id: string; name: string }>;
  products: ProductOption[];
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
        {!invoiceRows.length ? (
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
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Нэхэмжлэлийн жагсаалт</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дугаар</TableHead>
                    <TableHead>Огноо</TableHead>
                    <TableHead>Дуусах хугацаа</TableHead>
                    <TableHead>Харилцагч</TableHead>
                    <TableHead className="text-right">Дүн</TableHead>
                    <TableHead>Төлөв</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceRows.map((inv) => (
                    <TableRow
                      key={inv.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedInvoiceId(inv.id)}
                    >
                      <TableCell className="font-medium">
                        {inv.invoice_number}
                      </TableCell>
                      <TableCell>{formatDate(inv.issue_date)}</TableCell>
                      <TableCell>
                        {inv.due_date ? formatDate(inv.due_date) : "-"}
                      </TableCell>
                      <TableCell>{inv.contact_name ?? "-"}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(inv.total_amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            STATUS_VARIANTS[inv.status ?? ""] ?? "outline"
                          }
                        >
                          {STATUS_LABELS[inv.status ?? ""] ?? inv.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </PageShell>
      <InvoiceDetailDrawer
        invoiceId={selectedInvoiceId}
        onClose={() => setSelectedInvoiceId(null)}
      />
    </>
  );
}
