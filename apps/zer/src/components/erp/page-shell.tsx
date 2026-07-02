import type * as React from "react";
import { cn } from "@/lib/utils";

interface PageShellProps {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PageShell({
  title,
  description,
  actions,
  children,
  className,
}: PageShellProps) {
  return (
    <div className={cn("flex flex-1 flex-col gap-6", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {title}
          </h1>
          {description && (
            <p className="text-xs text-muted-foreground sm:text-sm">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 [&>*]:w-full [&>*]:sm:w-auto">
            {actions}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
