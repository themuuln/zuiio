import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────

export type StatAccent =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info";

const ACCENTS: Record<StatAccent, { tile: string; icon: string }> = {
  default: { tile: "bg-muted", icon: "text-muted-foreground" },
  primary: { tile: "bg-primary/10", icon: "text-primary" },
  success: {
    tile: "bg-emerald-500/10",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    tile: "bg-amber-500/10",
    icon: "text-amber-600 dark:text-amber-400",
  },
  danger: { tile: "bg-destructive/10", icon: "text-destructive" },
  info: {
    tile: "bg-sky-500/10",
    icon: "text-sky-600 dark:text-sky-400",
  },
};

export interface StatCardProps {
  /** Card title / metric name */
  label: ReactNode;
  /** The number or formatted value */
  value: ReactNode;
  /** Optional icon shown next to the label (vertical) or in a tile (horizontal) */
  icon?: React.ComponentType<{ className?: string }>;
  /** Color treatment for the icon (and horizontal value) */
  accent?: StatAccent;
  /** Hint line under the value (vertical layout) */
  sub?: ReactNode;
  /** Wraps the card in a link */
  href?: string;
  /** Shows a skeleton in place of the value */
  loading?: boolean;
  /** vertical: label row on top, value below. horizontal: icon tile + value/label row */
  layout?: "vertical" | "horizontal";
  /** Vertical layout only: icon before or after the label */
  iconPosition?: "start" | "end";
  /** Optional trend row (vertical layout): arrow + value + comparison label */
  trend?: {
    direction: "up" | "down" | "neutral";
    value: ReactNode;
    percent?: ReactNode;
  } | null;
  /** Muted text after the trend value, e.g. "vs last month" */
  comparisonLabel?: ReactNode;
  className?: string;
  valueClassName?: string;
}

export interface StatCardsProps {
  children: ReactNode;
  /** Number of columns on sm+ screens (default 4); always 2 on mobile */
  columns?: 2 | 3 | 4;
  className?: string;
}

// ─── Component ─────────────────────────────────────────────────

/**
 * Standardized numeric KPI card.
 *
 * One component for every "card for a number" on list/dashboard pages:
 * vertical (icon + label row, big value, optional sub/trend) and
 * horizontal (accented icon tile next to value + label).
 *
 * @example
 * ```tsx
 * <StatCards>
 *   <StatCard label={t("total")} value={formatMNT(total)} icon={DollarSign} accent="success" />
 *   <StatCard label={t("overdue")} value={overdue} icon={AlertTriangle} accent="danger" loading={isPending} />
 * </StatCards>
 * ```
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "default",
  sub,
  href,
  loading = false,
  layout = "vertical",
  iconPosition = "start",
  trend,
  comparisonLabel,
  className,
  valueClassName,
}: StatCardProps) {
  const accentClasses = ACCENTS[accent];

  let inner: ReactNode;

  if (layout === "horizontal") {
    inner = (
      <Card className={cn("py-3", className)}>
        <CardContent className="flex items-center gap-3 p-0 px-4">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              accentClasses.tile,
            )}
            aria-hidden="true"
          >
            {Icon && <Icon className={cn("size-4", accentClasses.icon)} />}
          </div>
          <div className="min-w-0">
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <p
                className={cn(
                  "text-2xl font-semibold leading-none tracking-tight tabular-nums",
                  accentClasses.icon,
                  valueClassName,
                )}
              >
                {value}
              </p>
            )}
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {label}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  } else {
    inner = (
      <Card className={cn("transition-shadow hover:shadow-sm", className)}>
        <CardContent className="flex flex-col gap-1.5 p-4">
          <div
            className={cn(
              "flex items-center gap-2",
              iconPosition === "end" && "justify-between",
            )}
          >
            {Icon && iconPosition === "start" && (
              <Icon
                className={cn("size-4 shrink-0", accentClasses.icon)}
                aria-hidden="true"
              />
            )}
            <span className="text-xs text-muted-foreground">{label}</span>
            {Icon && iconPosition === "end" && (
              <Icon
                className={cn("size-4 shrink-0", accentClasses.icon)}
                aria-hidden="true"
              />
            )}
          </div>
          {loading ? (
            <Skeleton className="h-7 w-24" />
          ) : (
            <div
              className={cn(
                "text-2xl font-semibold tracking-tight tabular-nums",
                valueClassName,
              )}
            >
              {value}
            </div>
          )}
          {!loading && trend && (
            <div className="flex items-center gap-1.5 text-xs">
              {trend.direction === "up" && (
                <ArrowUp
                  className="size-3.5 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
              )}
              {trend.direction === "down" && (
                <ArrowDown
                  className="size-3.5 text-destructive"
                  aria-hidden="true"
                />
              )}
              {trend.direction === "neutral" && (
                <Minus
                  className="size-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
              <span
                className={cn(
                  "font-medium",
                  trend.direction === "up"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : trend.direction === "down"
                      ? "text-destructive"
                      : "text-muted-foreground",
                )}
              >
                {trend.value}
                {trend.percent != null && ` (${trend.percent})`}
              </span>
              {comparisonLabel && (
                <span className="text-muted-foreground">{comparisonLabel}</span>
              )}
            </div>
          )}
          {!loading && sub && (
            <div className="text-xs text-muted-foreground">{sub}</div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }

  return inner;
}

/**
 * Responsive grid wrapper for StatCard groups.
 * 2 columns on mobile, `columns` on sm+.
 */
export function StatCards({
  children,
  columns = 4,
  className,
}: StatCardsProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3",
        columns === 3 && "sm:grid-cols-3",
        columns === 4 && "sm:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
