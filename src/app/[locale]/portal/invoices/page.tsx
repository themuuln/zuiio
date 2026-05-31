"use client";

import { useQuery } from "@tanstack/react-query";
import { Download, ExternalLink, FileText, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { PageErrorState, PageShellSkeleton } from "@/components/page-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Typography } from "@/components/ui/typography";
import { usePortalAuth } from "@/hooks/use-portal-auth";
import { formatMNT } from "@/lib/utils";

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  paid: "default",
  sent: "secondary",
  overdue: "destructive",
  draft: "outline",
  partial: "secondary",
  cancelled: "outline",
};

const CAN_PAY = new Set(["sent", "overdue", "partial", "draft"]);

export default function PortalInvoicesPage() {
  const t = useTranslations();
  const { customer, loading: authLoading, token } = usePortalAuth();
  const [payingInvoice, setPayingInvoice] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const {
    data: invoices,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["portal", "invoices"],
    queryFn: async () => {
      const res = await fetch("/api/portal/invoices", { headers });
      if (!res.ok) throw new Error(t("portal.failedToLoadInvoices"));
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!customer,
  });

  async function handlePay() {
    if (!payingInvoice) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/portal/invoices/${payingInvoice.id as string}/pay`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          body: JSON.stringify({
            invoiceId: payingInvoice.id,
            amount: payingInvoice.total,
            reference: payingInvoice.invoice_number,
          }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message ?? "Payment failed");
      }
      toast.success(t("portal.paymentSuccess"));
      setPayingInvoice(null);
      refetch();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("portal.paymentFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || isLoading) {
    return <PageShellSkeleton cards={2} />;
  }

  if (error) {
    return (
      <PageErrorState
        description={error.message}
        onRetry={() => refetch()}
        className="min-h-[260px]"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Typography.H1 className="text-2xl font-semibold tracking-tight">
          {t("portal.invoices")}
        </Typography.H1>
        <Typography.Muted className="text-sm text-muted-foreground mt-1">
          {t("portal.invoicesDesc")}
        </Typography.Muted>
      </div>

      {!invoices || invoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="size-10 text-muted-foreground/40 mb-3" />
            <Typography.Muted className="text-sm text-muted-foreground">
              {t("portal.noInvoices")}
            </Typography.Muted>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {invoices.map((inv: Record<string, unknown>) => (
            <Card key={inv.id as string}>
              <CardContent className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold">
                      #{inv.invoice_number as string}
                    </span>
                    <Badge
                      variant={
                        STATUS_VARIANTS[inv.status as string] ?? "outline"
                      }
                    >
                      {inv.status as string}
                    </Badge>
                  </div>
                  <Typography.Muted className="text-xs text-muted-foreground/60 mt-0.5">
                    {inv.issued_at
                      ? new Date(inv.issued_at as string).toLocaleDateString()
                      : ""}
                    {inv.vehicle_plate ? ` · ${inv.vehicle_plate}` : ""}
                  </Typography.Muted>
                </div>
                <div className="flex flex-wrap items-center gap-2 self-start sm:shrink-0 sm:self-center">
                  <span className="text-sm font-semibold tabular-nums">
                    {formatMNT(Number(inv.total ?? 0))}
                  </span>
                  {CAN_PAY.has(inv.status as string) && (
                    <Button
                      size="sm"
                      className="text-xs"
                      onClick={() => setPayingInvoice(inv)}
                    >
                      {t("portal.payNow")}
                    </Button>
                  )}
                  {(inv.public_token as string) && (
                    <>
                      <a
                        href={`/invoice/${inv.public_token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs gap-1"
                        >
                          <ExternalLink className="size-3" />
                          View
                        </Button>
                      </a>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1"
                        onClick={() =>
                          window.open(
                            `/api/invoice/public/${inv.public_token}/pdf`,
                            "_blank",
                          )
                        }
                      >
                        <Download className="size-3.5" />
                        PDF
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={!!payingInvoice}
        onOpenChange={(open) => {
          if (!open) setPayingInvoice(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("portal.payInvoice")} &mdash; #
              {payingInvoice?.invoice_number as string}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-muted p-4 flex flex-col gap-2">
              <Typography.Text className="text-sm font-medium">
                {t("portal.bankTransferInfo")}
              </Typography.Text>
              <div className="text-xs text-muted-foreground flex flex-col gap-1">
                <Typography.Text className="font-medium text-foreground text-sm">
                  {t("portal.payInvoice")}:{" "}
                  {formatMNT(Number(payingInvoice?.total ?? 0))}
                </Typography.Text>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-muted p-3">
              <Typography.Muted className="text-xs text-muted-foreground">
                {t("portal.paymentNote")}
              </Typography.Muted>
            </div>
          </div>
          <Button
            className="w-full mt-2"
            onClick={handlePay}
            disabled={submitting}
          >
            {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
            {t("portal.confirmPayment")}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
