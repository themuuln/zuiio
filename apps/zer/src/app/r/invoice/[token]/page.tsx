import { capture, withDbCapture } from "@zuiio/capture";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
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
import { createClient } from "@/lib/supabase/server";

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
export default function PublicInvoicePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return (
    <Suspense fallback={<InvoiceSkeleton />}>
      <InvoiceDataFetcher params={params} />
    </Suspense>
  );
}

async function InvoiceDataFetcher({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  try {
    const { data: invoiceData, error: rpcError } = await withDbCapture(
      "public invoice: RPC lookup",
      supabase.rpc("get_public_invoice", { p_token: token }),
    );

    if (rpcError) {
      capture(rpcError, { context: "public invoice: RPC lookup" });
      notFound();
    }

    if (!invoiceData) {
      notFound();
    }

    const invoice = invoiceData as {
      id: string;
      invoice_number: string;
      issue_date: string;
      status: string;
      total_amount: number;
      paid_amount: number;
      notes: string | null;
      organization_name: string;
      contact_name: string | null;
      contact_phone: string | null;
      items: Array<{
        description: string;
        quantity: number;
        unit_price: number;
        total_price: number;
        product_name: string | null;
        product_unit: string | null;
      }> | null;
    };

    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <style>{`
          @media print {
            body { font-size: 11pt; }
            .no-print { display: none !important; }
            table { page-break-inside: avoid; }
            tr { page-break-inside: avoid; }
            .print\\:hidden { display: none !important; }
          }
        `}</style>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Нэхэмжлэл #{invoice.invoice_number}
          </h1>
          <p className="text-sm text-muted-foreground">
            {invoice.organization_name ?? "Байгууллага"} —{" "}
            {formatDate(invoice.issue_date)}
          </p>
          <Badge variant={STATUS_VARIANTS[invoice.status ?? ""] ?? "outline"}>
            {STATUS_LABELS[invoice.status ?? ""] ?? invoice.status}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Бараанууд</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Бараа</TableHead>
                  <TableHead className="text-right">Тоо</TableHead>
                  <TableHead className="text-right">Нэгж үнэ</TableHead>
                  <TableHead className="text-right">Нийт</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(invoice.items ?? []).map((item) => (
                  <TableRow
                    key={`${item.description}-${item.unit_price}-${item.quantity}`}
                  >
                    <TableCell>
                      {item.description || item.product_name || "Бүтээгдэхүүн"}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.quantity} {item.product_unit ?? ""}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.unit_price)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.total_price)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <div className="w-full max-w-sm space-y-2">
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Нийт дүн</span>
              <span className="text-xl font-bold">
                {formatCurrency(invoice.total_amount ?? 0)}
              </span>
            </div>
            {(invoice.paid_amount ?? 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Төлсөн</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(invoice.paid_amount ?? 0)}
                </span>
              </div>
            )}
          </div>
        </div>

        {invoice.contact_name && (
          <Card>
            <CardHeader>
              <CardTitle>Харилцагчийн мэдээлэл</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{invoice.contact_name}</p>
              {invoice.contact_phone && (
                <p className="text-sm text-muted-foreground">
                  {invoice.contact_phone}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {invoice.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Тэмдэглэл</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{invoice.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  } catch (err) {
    capture(err, { context: "public invoice" });
    notFound();
  }
}

function InvoiceSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
        <div className="h-5 w-32 animate-pulse rounded bg-muted mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex gap-4">
              <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
