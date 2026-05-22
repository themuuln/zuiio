"use client";

import { ExternalLink, FileText, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePortalAuth } from "@/hooks/use-portal-auth";
import { formatMNT } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  partial: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  cancelled: "bg-gray-100 text-gray-500",
};

const CAN_PAY = new Set(["sent", "overdue", "partial", "draft"]);

export default function PortalInvoicesPage() {
  const t = useTranslations();
  const { customer, loading: authLoading, token } = usePortalAuth();
  const [payingInvoice, setPayingInvoice] = useState<Record<string, unknown> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const { data: invoices, isLoading, refetch } = useQuery({
    queryKey: ["portal", "invoices"],
    queryFn: async () => {
      const res = await fetch("/api/portal/invoices", { headers });
      if (!res.ok) return [];
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!customer,
  });

  async function handlePay() {
    if (!payingInvoice) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/portal/invoices/${payingInvoice.id as string}/pay`, {
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
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message ?? "Payment failed");
      }
      toast.success(t("portal.paymentSuccess"));
      setPayingInvoice(null);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("portal.paymentFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-48" />
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <Skeleton key={`skeleton-${i}`} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("portal.invoices")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("portal.invoicesDesc")}
        </p>
      </div>

      {!invoices || invoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="size-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              {t("portal.noInvoices")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {invoices.map((inv: Record<string, unknown>) => (
            <Card key={inv.id as string}>
              <CardContent className="flex items-center justify-between py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      #{inv.invoice_number as string}
                    </span>
                    <Badge
                      variant="secondary"
                      className={STATUS_COLORS[inv.status as string] ?? ""}
                    >
                      {inv.status as string}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">
                    {inv.issued_at
                      ? new Date(inv.issued_at as string).toLocaleDateString()
                      : ""}
                    {inv.vehicle_plate ? ` · ${inv.vehicle_plate}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
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
                  {inv.public_token as string && (
                    <a
                      href={`/invoice/${inv.public_token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm" className="text-xs gap-1">
                        <ExternalLink className="size-3" />
                        View
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={!!payingInvoice}
        onOpenChange={(open) => { if (!open) setPayingInvoice(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("portal.payInvoice")} &mdash; #{payingInvoice?.invoice_number as string}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <p className="text-sm font-medium">{t("portal.bankTransferInfo")}</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground text-sm">
                  {t("portal.payInvoice")}: {formatMNT(Number(payingInvoice?.total ?? 0))}
                </p>
              </div>
            </div>
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                {t("portal.paymentNote")}
              </p>
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
