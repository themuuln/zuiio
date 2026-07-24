import { capture, withDbCapture } from "@zuiio/capture";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PublicDocumentActions } from "@/components/public/public-document-actions";
import { PublicDocumentShell } from "@/components/public/public-document-shell";
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
export default function PublicReceiptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return (
    <Suspense fallback={<ReceiptSkeleton />}>
      <ReceiptDataFetcher params={params} />
    </Suspense>
  );
}

async function ReceiptDataFetcher({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  try {
    const { data: receiptData, error: rpcError } = await withDbCapture(
      "public receipt: RPC lookup",
      supabase.rpc("get_public_receipt", { p_token: token }),
    );

    if (rpcError) {
      capture(rpcError, { context: "public receipt: RPC lookup" });
      notFound();
    }

    if (!receiptData) {
      notFound();
    }

    const receipt = receiptData as {
      id: string;
      invoice_number: string;
      receipt_number: string | null;
      issue_date: string;
      status: string;
      total_amount: number;
      paid_amount: number;
      notes: string | null;
      cashier_name: string | null;
      ebarimt_id: string | null;
      seller: { name?: string; phone?: string; address?: string } | null;
      buyer: { name?: string; phone?: string } | null;
      branch: { name?: string; address?: string; phone?: string } | null;
      lines: Array<{
        description: string;
        quantity: number;
        unit_price: number;
        total_price: number;
        product_name?: string;
      }> | null;
      totals: {
        subtotal?: number;
        discount?: number;
        tax?: number;
        total?: number;
      } | null;
      payment_splits: Array<{
        method: string;
        amount: number;
      }> | null;
      organization_name: string;
    };

    return (
      <PublicDocumentShell
        title={`Баримт №${receipt.receipt_number ?? receipt.invoice_number}`}
        organizationName={receipt.branch?.name ?? receipt.organization_name}
        issueDate={formatDate(receipt.issue_date)}
        status={receipt.status}
        actions={<PublicDocumentActions pdfUrl={`/r/receipt/${token}/pdf`} />}
      >
        <style>{`
          @media print {
            body { font-size: 11pt; }
            .no-print { display: none !important; }
            table { page-break-inside: avoid; }
            tr { page-break-inside: avoid; }
            .print\\:hidden { display: none !important; }
          }
        `}</style>
        {/* Seller/Buyer info */}
        <div className="grid gap-4 text-sm sm:grid-cols-2">
          {receipt.seller && (
            <div>
              <p className="font-medium text-muted-foreground">Борлуулагч</p>
              <p>{receipt.seller.name}</p>
              {receipt.seller.phone && (
                <p className="text-muted-foreground">{receipt.seller.phone}</p>
              )}
            </div>
          )}
          {receipt.buyer?.name && (
            <div>
              <p className="font-medium text-muted-foreground">
                Худалдан авагч
              </p>
              <p>{receipt.buyer.name}</p>
            </div>
          )}
        </div>

        {/* Items */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Бараа</TableHead>
              <TableHead className="text-right">Тоо</TableHead>
              <TableHead className="text-right">Нэгж үнэ</TableHead>
              <TableHead className="text-right">Дүн</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(receipt.lines ?? []).map((line) => (
              <TableRow
                key={`${line.product_name ?? line.description}-${line.quantity}`}
              >
                <TableCell>{line.product_name ?? line.description}</TableCell>
                <TableCell className="text-right">{line.quantity}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(line.unit_price)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(line.total_price)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Нийт дүн</span>
              <span>
                {formatCurrency(
                  receipt.totals?.subtotal ?? receipt.total_amount,
                )}
              </span>
            </div>
            {(receipt.totals?.discount ?? 0) > 0 && (
              <div className="flex justify-between text-destructive">
                <span>Хөнгөлөлт</span>
                <span>-{formatCurrency(receipt.totals?.discount ?? 0)}</span>
              </div>
            )}
            {(receipt.totals?.tax ?? 0) > 0 && (
              <div className="flex justify-between">
                <span>НӨАТ</span>
                <span>{formatCurrency(receipt.totals?.tax ?? 0)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-1 font-semibold">
              <span>Төлөх дүн</span>
              <span>{formatCurrency(receipt.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Payment splits */}
        {receipt.payment_splits && receipt.payment_splits.length > 0 && (
          <div className="text-sm">
            <p className="mb-1 font-medium text-muted-foreground">
              Төлбөрийн хэлбэр
            </p>
            {receipt.payment_splits.map((split) => (
              <div
                key={`${split.method}-${split.amount}`}
                className="flex justify-between"
              >
                <span>{split.method}</span>
                <span>{formatCurrency(split.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {/* eBarimt */}
        {receipt.ebarimt_id && (
          <p className="text-xs text-muted-foreground">
            eBarimt: {receipt.ebarimt_id}
          </p>
        )}

        {/* Cashier */}
        {receipt.cashier_name && (
          <p className="text-xs text-muted-foreground">
            Кассир: {receipt.cashier_name}
          </p>
        )}
      </PublicDocumentShell>
    );
  } catch (err) {
    capture(err, { context: "public receipt" });
    notFound();
  }
}

function ReceiptSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-4 w-full animate-pulse rounded bg-muted" />
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
  );
}
