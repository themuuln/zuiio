"use client";

import { Banknote, CheckCircle2, ChevronLeft, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { Link } from "@/lib/i18n/navigation";
import { useCashRegisterSessions } from "@/lib/queries/use-cash-register";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { formatCurrency } from "@/lib/utils";

export function CashRegisterHistoryClient() {
  const t = useTranslations() as (key: string, values?: Record<string, string | number>) => string;
  const { data: org, isPending: orgLoading } = useCurrentOrg();
  const orgId = org?.orgId;

  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isPending, error } = useCashRegisterSessions(orgId, {
    status: "closed",
    limit,
    offset: page * limit,
  });

  const sessions = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  useEffect(() => {
    if (data) setHasLoadedOnce(true);
  }, [data]);

  const showSkeleton = orgLoading || (isPending && !hasLoadedOnce);

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/cash-register">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Banknote className="size-5 text-primary" />
          <Typography.H2 className="m-0 text-xl font-semibold">
            {t("cashRegister.sessionHistory")}
          </Typography.H2>
        </div>
      </div>

      <Separator />
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          {error.message}
        </div>
      )}

      {/* Sessions list */}
      {showSkeleton ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Banknote className="size-10 text-muted-foreground" />
            <Typography.Muted>
              {t("cashRegister.noClosedSessions")}
            </Typography.Muted>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {sessions.map((session) => {
            const isBalanced =
              session.discrepancy !== null && session.discrepancy === 0;
            const isOver =
              session.discrepancy !== null && session.discrepancy > 0;
            const _isShort =
              session.discrepancy !== null && session.discrepancy < 0;

            return (
              <Card key={session.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-8 items-center justify-center rounded-full ${
                        isBalanced
                          ? "bg-green-100 dark:bg-green-900/30"
                          : isOver
                            ? "bg-blue-100 dark:bg-blue-900/30"
                            : "bg-red-100 dark:bg-red-900/30"
                      }`}
                    >
                      {isBalanced ? (
                        <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle
                          className={`size-4 ${
                            isOver
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Typography.Text className="font-medium">
                          {new Date(session.date).toLocaleDateString()}
                        </Typography.Text>
                        <Badge variant="secondary" className="text-xs">
                          {session.status}
                        </Badge>
                      </div>
                      <Typography.Muted className="text-xs">
                        {t("cashRegister.openingBalance")}{" "}
                        {formatCurrency(session.opening_balance)} →{" "}
                        {t("cashRegister.closingBalance")}{" "}
                        {formatCurrency(session.closing_balance ?? 0)}
                      </Typography.Muted>
                    </div>
                  </div>
                  <div className="text-right">
                    <Typography.Text className="text-sm font-medium tabular-nums">
                      {formatCurrency(session.expected_balance ?? 0)}
                    </Typography.Text>
                    <Typography.Muted className="text-xs">
                      {session.discrepancy !== null && session.discrepancy !== 0
                        ? `${session.discrepancy > 0 ? t("cashRegister.over") : t("cashRegister.short")} ${formatCurrency(Math.abs(session.discrepancy))}`
                        : t("cashRegister.balanced")}
                    </Typography.Muted>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Typography.Muted className="text-sm">
            {page + 1} / {totalPages} ({total} sessions)
          </Typography.Muted>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
