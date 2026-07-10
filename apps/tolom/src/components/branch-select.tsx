"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Branch } from "@/lib/types";

interface BranchSelectProps {
  value: string;
  onChange: (branchId: string) => void;
  branches: Branch[];
  placeholder: string;
  allLabel: string;
  className?: string;
  /** When provided, renders an "Add Branch" item at the bottom of the dropdown. */
  onAddBranch?: () => void;
}

export function BranchSelect({
  value,
  onChange,
  branches,
  placeholder,
  allLabel,
  className,
  onAddBranch,
}: BranchSelectProps) {
  return (
    <Select value={value || "all"} onValueChange={(v) => onChange(v ?? "all")}>
      <SelectTrigger className={className ?? "min-w-44"}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent align="start">
        <SelectItem value="all">{allLabel}</SelectItem>
        {branches.map((branch) => (
          <SelectItem key={branch.id} value={branch.id}>
            {branch.name}
          </SelectItem>
        ))}
        {onAddBranch && (
          <>
            <div className="h-px bg-border my-1" />
            <button
              type="button"
              className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              onClick={(e) => {
                e.preventDefault();
                onAddBranch();
              }}
            >
              + Add Branch
            </button>
          </>
        )}
      </SelectContent>
    </Select>
  );
}
