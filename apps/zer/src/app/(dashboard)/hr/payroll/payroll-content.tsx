"use client";

import { CurrencyDollar } from "@phosphor-icons/react/dist/ssr";
import { useQuery } from "@tanstack/react-query";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { PayrollRunList } from "@/components/hr/payroll-run-list";
import type { PayrollRunRow } from "@/components/hr/payroll-run-list";
import { useOrgSettings } from "@/lib/org-settings-context";
import { createClient } from "@/lib/supabase/client";
import { withDbCapture } from "@zuiio/capture";

export function PayrollContent() {
  const { organizationId } = useOrgSettings();

  const query = useQuery({
    queryKey: ["hr", "payroll-runs", organizationId],
    queryFn: async () => {
      const supabase = createClient();
      const { data: runs } = await withDbCapture(
        "page:hr_payroll payroll_runs",
        supabase
          .from("payroll_runs")
          .select(
            "id, period_start, period_end, status, total_gross, total_net, total_si_employee, created_at",
          )
          .eq("organization_id", organizationId)
          .order("period_start", { ascending: false }),
      );
      return runs as unknown as PayrollRunRow[];
    },
    enabled: !!organizationId,
  });

  const runs = query.data ?? [];
  const isLoading = query.isLoading || query.isFetching;

  return (
    <PageShell title="Цалин" description="Цалингийн бүртгэл, тооцоо, түүх">
      {isLoading ? (
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      ) : !runs.length ? (
        <ErpEmptyState
          icon={<CurrencyDollar className="size-4" />}
          title="Цалин бодогдоогүй"
          description="Ажилтан бүртгүүлээд, цалингийн шинэ run үүсгэнэ."
        />
      ) : (
        <PayrollRunList data={runs} />
      )}
    </PageShell>
  );
}
