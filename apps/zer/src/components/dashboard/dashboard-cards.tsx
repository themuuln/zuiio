import { cn } from "@/lib/utils";

export function HeroActionCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <a href={href} className="group block">
      <div className="rounded-xl border bg-card text-card-foreground shadow-xs transition-all hover:border-primary/50 hover:shadow-md">
        <div className="flex items-center gap-4 p-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary [&>svg]:transition-transform [&>svg]:group-hover:scale-110">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{title}</p>
            <p className="truncate text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      </div>
    </a>
  );
}

export function PulseCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "emerald" | "red" | "blue" | "amber";
}) {
  const colorClasses: Record<string, string> = {
    emerald:
      "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/50",
    red: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50",
    blue: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50",
    amber:
      "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50",
  };
  const iconClasses: Record<string, string> = {
    emerald:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400",
    red: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400",
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400",
  };

  return (
    <div className={cn("rounded-xl border shadow-xs", colorClasses[color])}>
      <div className="flex items-center gap-3 px-4 py-4">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            iconClasses[color],
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <p className="text-base font-bold tabular-nums tracking-tight">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ShortcutCard({
  href,
  icon,
  label,
  count,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  count: string;
}) {
  return (
    <a href={href} className="group block">
      <div className="rounded-xl border bg-card text-card-foreground shadow-xs transition-colors hover:bg-accent/50 [&_svg]:transition-transform [&_svg]:group-hover:scale-110">
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{label}</p>
            <p className="text-lg font-bold tabular-nums tracking-tight">
              {count}
            </p>
          </div>
        </div>
      </div>
    </a>
  );
}
