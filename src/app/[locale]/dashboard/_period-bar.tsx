import { Calendar, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

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
          <Button
            key={opt.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.key)}
            variant={active ? "default" : "ghost"}
            size="sm"
            className="min-h-[40px] gap-1.5 rounded-lg"
          >
            <Icon className="size-3.5" />
            {opt.label}
          </Button>
        );
      })}
    </div>
  );
}
