import { IdentificationBadge } from "@phosphor-icons/react/dist/ssr";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { EmployeeCreateDrawer } from "@/components/hr/employee-create-drawer";
import { EmployeeTable } from "@/components/hr/employee-table";
import { requireAppContext } from "@/lib/erp";

export default async function HrPage() {
  const { supabase, organizationId } = await requireAppContext();

  const { data: employees } = await supabase
    .from("employees" as never)
    .select(
      "id, full_name, position, department, hire_date, contract_type, base_salary, salary_type, is_active, branch_id, bank_account, created_at",
    )
    .eq("organization_id" as never, organizationId)
    .order("created_at" as never, { ascending: false });

  return (
    <PageShell
      title="Ажилтны бүртгэл"
      description="Байгууллагын ажилтнуудын мэдээлэл, цалин, албан тушаал"
      actions={<EmployeeCreateDrawer />}
    >
      {!employees?.length ? (
        <ErpEmptyState
          icon={<IdentificationBadge className="size-4" />}
          title="Ажилтан бүртгэгдээгүй"
          description="Ажилтан нэмж, цалин, ирц, чөлөөний модулиудыг ашиглана."
          action={<EmployeeCreateDrawer />}
        />
      ) : (
        <EmployeeTable data={(employees ?? []) as never} />
      )}
    </PageShell>
  );
}
