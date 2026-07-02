import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DetailSheetHeaderProps {
  icon: React.ComponentType<{ className?: string }>;
  iconLoading?: boolean;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function DetailSheetHeader({
  icon: Icon,
  iconLoading = false,
  title,
  subtitle,
  actions,
  className,
}: DetailSheetHeaderProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
        {iconLoading ? (
          <Loader2 className="size-5 animate-spin text-primary" />
        ) : (
          <Icon className="size-5 text-primary" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        {title}
        {subtitle && (
          <div className="mt-0.5 flex items-center gap-2">{subtitle}</div>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-1">{actions}</div>
      )}
    </div>
  );
}
