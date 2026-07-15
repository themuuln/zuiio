"use client";

import { DetailDrawerShell } from "@/components/ui/detail-drawer-shell";
import { InfoRow } from "@/components/ui/info-row";
import { formatCurrency } from "@/lib/format";

type EmployeeData = {
  id: string;
  full_name: string;
  position: string | null;
  department: string | null;
  hire_date: string;
  contract_type: string;
  base_salary: number;
  salary_type: string;
  is_active: boolean;
  bank_account: string | null;
  branch_id: string | null;
  created_at: string;
};

const CONTRACT_LABELS: Record<string, string> = {
  permanent: "Байнгын",
  temporary: "Түр",
  contract: "Гэрээт",
};

const SALARY_LABELS: Record<string, string> = {
  monthly: "Сар",
  daily: "Өдөр",
  hourly: "Цаг",
};

export function EmployeeDetailDrawer({
  employee,
  open,
  onOpenChange,
  onEdit,
}: {
  employee: EmployeeData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}) {
  return (
    <DetailDrawerShell
      open={open}
      onOpenChange={onOpenChange}
      title={employee.full_name}
      description={employee.position ?? "Албан тушаал тодорхойгүй"}
      status={{
        value: employee.is_active ? "active" : "inactive",
        mapping: {
          active: { label: "Идэвхтэй", variant: "default" as const },
          inactive: { label: "Идэвхгүй", variant: "secondary" as const },
        },
      }}
      onEdit={onEdit}
    >
      <div className="space-y-1">
        <InfoRow label="Албан тушаал" value={employee.position ?? "-"} />
        <InfoRow label="Хэлтэс" value={employee.department ?? "-"} />
        <InfoRow label="Ажилд орсон" value={employee.hire_date ?? "-"} />
        <InfoRow
          label="Гэрээний төрөл"
          value={
            CONTRACT_LABELS[employee.contract_type] ?? employee.contract_type
          }
        />
        <InfoRow
          label="Үндсэн цалин"
          value={formatCurrency(employee.base_salary)}
        />
        <InfoRow
          label="Цалингийн төрөл"
          value={SALARY_LABELS[employee.salary_type] ?? employee.salary_type}
        />
        <InfoRow label="Данс" value={employee.bank_account ?? "-"} />
      </div>
    </DetailDrawerShell>
  );
}
