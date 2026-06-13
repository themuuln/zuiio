"use client";

import type { ReactNode } from "react";
import { ErrorBoundary } from "@/components/error-boundary";

interface ErrorSectionProps {
  children: ReactNode;
  label?: string;
}

/**
 * Granular error boundary for bay view sections.
 * Wraps independently-failing sections so one crash doesn't take down the whole page.
 */
export function ErrorSection({ children, label }: ErrorSectionProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center py-8 gap-2 rounded-lg border border-destructive/20 bg-destructive/5">
          <span className="text-sm text-muted-foreground">
            {label ? `${label} — ` : ""}Something went wrong
          </span>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
