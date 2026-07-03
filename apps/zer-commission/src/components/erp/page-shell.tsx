import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageShell({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/85 px-5 py-5 shadow-sm backdrop-blur-sm md:px-7 md:py-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(135deg,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_60%)]" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
              Zer ERP Workspace
            </p>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {title}
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              {description}
            </p>
          </div>
          {actions ? (
            <div className="flex flex-wrap gap-2">{actions}</div>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  );
}
