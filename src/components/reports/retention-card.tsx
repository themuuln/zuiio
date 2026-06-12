/**
 * RetentionCard — Customer retention analytics.
 *
 * Shows: retention rate, returning vs new customers, avg visits, LTV, top customers.
 */
import { Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import type { CustomerRetentionData } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface RetentionCardProps {
  data: CustomerRetentionData | null;
  loading?: boolean;
}

export function RetentionCard({ data, loading }: RetentionCardProps) {
  const t = useTranslations("reports");

  if (loading) return <Skeleton className="h-[200px] rounded-xl" />;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Users className="size-4 text-muted-foreground" aria-hidden="true" />
          {t("customerRetention")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {data && data.total_customers > 0 ? (
          <>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-lg font-semibold tabular-nums">
                  {data.retention_rate}%
                </span>
                <span className="block text-[10px] text-muted-foreground">
                  {t("retention")}
                </span>
              </div>
              <div>
                <span className="text-lg font-semibold tabular-nums">
                  {data.returning_customers}
                </span>
                <span className="block text-[10px] text-muted-foreground">
                  {t("returning")}
                </span>
              </div>
              <div>
                <span className="text-lg font-semibold tabular-nums">
                  {data.new_customers}
                </span>
                <span className="block text-[10px] text-muted-foreground">
                  {t("newCustomers")}
                </span>
              </div>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-xs">
              <span className="text-muted-foreground">
                {t("avgVisitsPerCustomer")}
              </span>
              <span className="font-medium tabular-nums">
                {data.avg_visits_per_customer}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                {t("avgLifetimeValue")}
              </span>
              <span className="font-medium tabular-nums">
                {formatCurrency(data.avg_lifetime_value)}
              </span>
            </div>
            {data.top_customers.length > 0 && (
              <div className="border-t border-border pt-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {t("topCustomers")}
                </span>
                <div className="mt-1 flex flex-col gap-1">
                  {data.top_customers.slice(0, 3).map((c) => (
                    <div
                      key={c.customer_id}
                      className="flex justify-between gap-3 text-xs"
                    >
                      <span className="truncate">{c.customer_name}</span>
                      <span className="font-medium tabular-nums">
                        {formatCurrency(c.total_revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <Typography.Muted className="py-8 text-center text-sm text-muted-foreground">
            {t("noDataForPeriod")}
          </Typography.Muted>
        )}
      </CardContent>
    </Card>
  );
}
