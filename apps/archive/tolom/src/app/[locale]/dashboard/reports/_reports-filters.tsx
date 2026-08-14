import { BranchSelect } from "@/components/branch-select";
import { MechanicSelect } from "@/components/mechanic-select";
import type { Branch } from "@/lib/types";
import { hasMultipleBranches } from "@/lib/utils";

interface ReportsFiltersProps {
  branches: Branch[];
  selectedBranchId: string;
  onBranchChange: (id: string) => void;
  mechanics: { id: string; fullName: string | null; email: string }[];
  mechanicFilter: string;
  onMechanicFilterChange: (id: string) => void;
  t: (key: string) => string;
}

export function ReportsFilters({
  branches,
  selectedBranchId,
  onBranchChange,
  mechanics,
  mechanicFilter,
  onMechanicFilterChange,
  t,
}: ReportsFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {hasMultipleBranches(branches) && (
        <BranchSelect
          value={selectedBranchId}
          onChange={onBranchChange}
          branches={branches}
          placeholder={t("branch")}
          allLabel={t("allBranches")}
          className="min-w-44"
        />
      )}
      <MechanicSelect
        value={mechanicFilter}
        onChange={onMechanicFilterChange}
        mechanics={mechanics}
        placeholder={t("allMechanics")}
        size="default"
      />
    </div>
  );
}
