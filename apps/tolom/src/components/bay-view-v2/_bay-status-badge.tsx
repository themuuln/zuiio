import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_BADGE_CLASS } from "./_constants";

interface BayStatusBadgeProps {
  status: string;
  label: string;
  className?: string;
}

export function BayStatusBadge({
  status,
  label,
  className,
}: BayStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-6 rounded-full border px-2.5 text-[11px] font-bold uppercase tracking-wide",
        STATUS_BADGE_CLASS[status] ??
          "bg-muted border-muted-foreground/30 text-muted-foreground",
        className,
      )}
    >
      {status === "In Progress" && (
        <span className="mr-2 inline-block size-1.5 animate-pulse rounded-full bg-current" />
      )}
      {label}
    </Badge>
  );
}
