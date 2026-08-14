import { cn } from "@/lib/utils";
import { STATUS_DOT, STATUS_FILTER_ACTIVE } from "./_constants";

interface StatusFilterProps {
  statusFilter: string | null;
  setStatusFilter: (v: string | null) => void;
  t: (key: string) => string;
}

export function StatusFilter({
  statusFilter,
  setStatusFilter,
  t,
}: StatusFilterProps) {
  return (
    <div className="flex items-center gap-px rounded-lg border border-border/50 bg-muted/40 p-0.5 h-8">
      {(
        [
          {
            key: null,
            label: t("allStatuses"),
            dot: null,
            activeBg: "bg-background",
          },
          {
            key: "In Progress" as const,
            label: t("inProgress"),
            dot: STATUS_DOT["In Progress"],
            activeBg: STATUS_FILTER_ACTIVE["In Progress"],
          },
          {
            key: "New" as const,
            label: t("newStatus"),
            dot: STATUS_DOT.New,
            activeBg: STATUS_FILTER_ACTIVE.New,
          },
          {
            key: "Ready for Pickup" as const,
            label: t("ready"),
            dot: STATUS_DOT["Ready for Pickup"],
            activeBg: STATUS_FILTER_ACTIVE["Ready for Pickup"],
          },
        ] as const
      ).map((opt) => (
        <button
          key={opt.key ?? "all"}
          type="button"
          onClick={() => setStatusFilter(opt.key)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-[color,background-color,border-color] duration-200 cursor-pointer h-8",
            statusFilter === opt.key
              ? cn("text-foreground border border-border/30", opt.activeBg)
              : "text-muted-foreground/60 hover:bg-muted/60 hover:text-foreground/80",
          )}
        >
          {opt.dot && (
            <span
              className={cn(
                "size-1.5 rounded-full shrink-0 ring-1 ring-black/5",
                opt.dot,
              )}
            />
          )}
          {opt.label}
        </button>
      ))}
    </div>
  );
}
