import { cn } from "@/lib/utils";

interface BayNumberLabelProps {
  bayNumber: number;
  className?: string;
}

export function BayNumberLabel({ bayNumber, className }: BayNumberLabelProps) {
  return (
    <span
      className={cn("font-mono text-xs font-black tracking-wider", className)}
    >
      BAY {String(bayNumber).padStart(2, "0")}
    </span>
  );
}
