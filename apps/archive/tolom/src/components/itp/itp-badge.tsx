import type { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const itpBadgeVariants = cva("", {
  variants: {
    status: {
      valid: "",
      expiring_soon: "",
      expired: "",
      unknown: "",
    },
  },
  defaultVariants: {
    status: "unknown",
  },
});

const statusColors: Record<
  NonNullable<VariantProps<typeof itpBadgeVariants>["status"]>,
  {
    variant:
      | "default"
      | "secondary"
      | "destructive"
      | "outline"
      | "ghost"
      | "link";
    label: string;
  }
> = {
  valid: { variant: "default", label: "Valid" },
  expiring_soon: { variant: "secondary", label: "Expiring Soon" },
  expired: { variant: "destructive", label: "Expired" },
  unknown: { variant: "outline", label: "Unknown" },
} as const;

export interface ItpBadgeProps
  extends useRender.ComponentProps<"span">,
    VariantProps<typeof itpBadgeVariants> {
  /** Computed ITP status */
  itpStatus: "valid" | "expiring_soon" | "expired" | "unknown";
  /** Days until expiry (null if unknown or expired) */
  daysUntilExpiry?: number | null;
  /** Click handler to open details */
  onDetailsClick?: () => void;
}

/**
 * ITP Badge component showing ITP status with color coding and expiry info.
 *
 * - valid: green badge
 * - expiring_soon: amber/yellow badge
 * - expired: red badge
 * - unknown: gray badge
 */
export function ItpBadge({
  itpStatus,
  daysUntilExpiry,
  onDetailsClick,
  className,
  ...props
}: ItpBadgeProps) {
  const color = statusColors[itpStatus] ?? statusColors.unknown;

  const displayLabel =
    itpStatus === "valid" && daysUntilExpiry != null
      ? `${daysUntilExpiry}d`
      : itpStatus === "expiring_soon" && daysUntilExpiry != null
        ? `${daysUntilExpiry}d`
        : itpStatus === "expired"
          ? "Expired"
          : "—";

  return (
    <Badge
      variant={color.variant}
      className={cn(
        "cursor-pointer transition-colors",
        itpStatus === "valid" &&
          "bg-emerald-600 text-white hover:bg-emerald-700",
        itpStatus === "expiring_soon" &&
          "bg-amber-500 text-white hover:bg-amber-600",
        itpStatus === "expired" && "",
        itpStatus === "unknown" && "",
        onDetailsClick && "cursor-pointer",
        className,
      )}
      onClick={onDetailsClick}
      title={
        daysUntilExpiry != null
          ? `${daysUntilExpiry} days until expiry`
          : "No expiry date set"
      }
      {...props}
    >
      {displayLabel}
    </Badge>
  );
}
