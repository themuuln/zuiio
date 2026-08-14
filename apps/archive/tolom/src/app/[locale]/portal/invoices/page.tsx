"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageErrorState, PageShellSkeleton } from "@/components/page-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  cancelled: "outline",
  refunded: "outline",
};

interface PortalInvoice {
  id: string;
  invoice_number: string;
  status: string;
  subtotal: number;
  total: number;
  amount_paid: number;
  balance_due: number;
  issued_at: string | null;
  due_at: string | null;
  created_at: string;
}

export default function PortalInvoicesPage() {
  const t = useTranslations() as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const { customer, loading: authLoading, token } = usePortalAuth();

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const {
    data: invoices,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["portal", "invoices", "list"],
    queryFn: async () => {
      const res = await fetch("/api/portal/invoices", { headers });
      if (!res.ok) throw new Error(t("portal.failedToLoadInvoices"));
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!customer,
  });

  if (authLoading || isLoading) {
    return <PageShellSkeleton cards={3} title={t("portal.invoices")} />;
  }

  if (error) {
    return (
      <PageErrorState
        title={t("common.somethingWentWrong")}
        description={error.message}
        onRetry={refetch}
      />
    );
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <Typography.H1 className="text-xl font-semibold">
          {t("portal.invoices")}
        </Typography.H1>
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <FileText className="size-10 text-muted-foreground/50" />
            <Typography.Muted className="text-sm text-muted-foreground">
              {t("portal.noInvoices")}
            </Typography.Muted>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Typography.H1 className="text-xl font-semibold">
        {t("portal.invoices")}
      </Typography.H1>

      <div className="flex flex-col gap-3">
        {invoices.map((inv: PortalInvoice) => (
          <Card key={inv.id} className="transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">
                    #{inv.invoice_number}
                  </span>
                  <Badge
                    variant={STATUS_VARIANTS[inv.status] ?? "outline"}
                    className="shrink-0 text-[10px]"
                  >
                    {inv.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span>{formatMNT(Number(inv.total))}</span>
                  {inv.due_at && (
                    <span>
                      Due: {new Date(inv.due_at).toLocaleDateString()}
                    </span>
                  )}
                  {inv.issued_at && (
                    <span>
                      Issued: {new Date(inv.issued_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
