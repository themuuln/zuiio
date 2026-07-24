import { Building2 } from "lucide-react";
import { cn, hasMultipleBranches } from "@/lib/utils";

export interface BranchPill {
  id: string;
  name: string;
}

interface BranchPillsProps {
  branches: BranchPill[];
  selectedBranchId: string;
  onBranchChange: (id: string) => void;
  t: (key: string) => string;
}

export function BranchPills({
  branches,
  selectedBranchId,
  onBranchChange,
  t,
}: BranchPillsProps) {
  if (!hasMultipleBranches(branches)) return null;

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-muted/40 p-1 h-8">
      {/* All pill */}
      <button
        type="button"
        onClick={() => onBranchChange("all")}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 text-xs font-semibold transition-[color,background-color,border-color] duration-200 cursor-pointer h-full",
          selectedBranchId === "all"
            ? "bg-background text-foreground font-bold border border-border/30"
            : "text-muted-foreground/80 hover:bg-muted/70 hover:text-foreground",
        )}
      >
        <Building2 className="size-4" />
        <span className="hidden sm:inline text-xs">{t("allBranches")}</span>
      </button>
      {branches.map((b) => (
        <button
          key={b.id}
          type="button"
          onClick={() => onBranchChange(b.id)}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 text-xs font-semibold transition-[color,background-color,border-color] duration-200 cursor-pointer h-full",
            selectedBranchId === b.id
              ? "bg-background text-foreground font-bold border border-border/30"
              : "text-muted-foreground/80 hover:bg-muted/70 hover:text-foreground",
          )}
        >
          <Building2 className="size-4" />
          <span className="hidden sm:inline text-xs">{b.name}</span>
        </button>
      ))}
    </div>
  );
}
