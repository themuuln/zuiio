import { cn } from "@/lib/utils";

export function InfoRow({
  icon,
  label,
  value,
  highlight,
  className,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-3 text-sm",
        className,
      )}
    >
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className={cn("font-medium", highlight && "text-amber-600")}>
        {value}
      </span>
    </div>
  );
}
