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
}

export function BranchSelect({
  value,
  onChange,
  branches,
  placeholder,
  allLabel,
  className,
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
      </SelectContent>
    </Select>
  );
}
