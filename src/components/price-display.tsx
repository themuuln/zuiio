import { cn } from "@/lib/utils";

function formatMNT(amount: number): string {
  return `₮${amount.toLocaleString("en-US")}`;
}

export function PriceDisplay({
  amount,
  lastSold,
  className,
}: {
  amount: number;
  lastSold?: number | null;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className="text-lg font-semibold tabular-nums">
        {formatMNT(amount)}
      </span>
      {lastSold != null && lastSold !== amount && (
        <span className="text-sm text-muted-foreground line-through tabular-nums">
          Last: {formatMNT(lastSold)}
        </span>
      )}
    </div>
  );
}
