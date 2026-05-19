import { Calendar, Clock, TrendingUp } from "lucide-react";

export type Period = "today" | "week" | "month" | "all";

type PeriodOption = {
  key: Period;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const OPTIONS: PeriodOption[] = [
  { key: "today", label: "Today", icon: Clock },
  { key: "week", label: "This Week", icon: Calendar },
  { key: "month", label: "This Month", icon: Calendar },
  { key: "all", label: "All Time", icon: TrendingUp },
];

export function PeriodBar({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  return (
    <div className="inline-flex rounded-xl bg-muted/60 p-1" role="tablist">
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.key)}
            className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-150 ${
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className={`size-3.5 ${active ? "text-primary" : ""}`} />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
