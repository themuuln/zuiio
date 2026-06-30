import { CurrencyDollar } from "@phosphor-icons/react/dist/ssr";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { PayrollRunList } from "@/components/hr/payroll-run-list";
import { requireAppContext } from "@/lib/erp";

export default async function PayrollPage() {
  const { supabase, organizationId } = await requireAppContext();

  const { data: runs } = await supabase
    .from("payroll_runs" as never)
    .select(
      "id, period_start, period_end, status, total_gross, total_net, total_si_employee, created_at",
    )
    .eq("organization_id" as never, organizationId)
    .order("period_start" as never, { ascending: false });

  return (
    <PageShell title="Цалин" description="Цалингийн бүртгэл, тооцоо, түүх">
      {!runs?.length ? (
        <ErpEmptyState
          icon={<CurrencyDollar className="size-4" />}
          title="Цалин бодогдоогүй"
          description="Ажилтан бүртгүүлээд, цалингийн шинэ run үүсгэнэ."
        />
      ) : (
        <PayrollRunList data={(runs ?? []) as never} />
      )}
    </PageShell>
  );
}
