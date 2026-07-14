"use client";

import { IdentificationBadge } from "@phosphor-icons/react/dist/ssr";
import { useQuery } from "@tanstack/react-query";
import { withDbCapture } from "@zuiio/capture";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { EmployeeTable } from "@/components/hr/employee-table";
import { Skeleton } from "@/components/ui/skeleton";
import { DynamicEmployeeCreateDrawer } from "@/lib/dynamic-drawers";
import { useOrgSettings } from "@/lib/org-settings-context";
import { createClient } from "@/lib/supabase/client";

type EmployeeRow = {
  id: string;
  full_name: string;
  position: string | null;
  department: string | null;
  hire_date: string;
  contract_type: string;
  base_salary: number;
  salary_type: string;
  is_active: boolean;
  branch_id: string | null;
  bank_account: string | null;
  created_at: string;
};

export function HrContent() {
  const { organizationId } = useOrgSettings();

  const query = useQuery({
    queryKey: ["hr", "employees", organizationId],
    queryFn: async () => {
      const supabase = createClient();
      const { data: employees } = await withDbCapture(
        "page:hr employees",
        supabase
          .from("employees")
          .select(
            "id, full_name, position, department, hire_date, contract_type, base_salary, salary_type, is_active, branch_id, bank_account, created_at",
          )
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false }),
      );
      return employees as unknown as EmployeeRow[];
    },
    enabled: !!organizationId,
  });

  const employees = query.data ?? [];
  const isLoading = query.isLoading || query.isFetching;

  return (
    <PageShell
      title="Ажилтны бүртгэл"
      description="Байгууллагын ажилтнуудын мэдээлэл, цалин, албан тушаал"
      actions={<DynamicEmployeeCreateDrawer />}
    >
      {isLoading ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-7 w-16 rounded-full" />
          </div>
          <div className="h-96 animate-pulse rounded-xl bg-muted" />
        </div>
      ) : !employees.length ? (
        <ErpEmptyState
          icon={<IdentificationBadge className="size-4" />}
          title="Ажилтан бүртгэгдээгүй"
          description="Ажилтан нэмж, цалин, ирц, чөлөөний модулиудыг ашиглана."
          action={<DynamicEmployeeCreateDrawer />}
        />
      ) : (
        <EmployeeTable data={employees} />
      )}
    </PageShell>
  );
}
