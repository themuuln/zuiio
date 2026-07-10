import { cn, formatMNT } from "@/lib/utils";

export function PriceDisplay({
  amount,
  lastSold,
  className,
}: {
  amount: number;
  lastSold?: number | null;
  className?: string;
}) {
  const isHigher = lastSold != null && amount > lastSold;

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span
        className={cn(
          "text-lg font-semibold tabular-nums",
          isHigher && "text-amber-600",
        )}
      >
        {formatMNT(amount)}
      </span>
      {lastSold != null && lastSold !== amount && (
        <span
          className={cn(
            "text-sm line-through tabular-nums",
            isHigher ? "text-amber-600" : "text-green-600",
          )}
        >
          Last: {formatMNT(lastSold)}
        </span>
      )}
    </div>
  );
}
