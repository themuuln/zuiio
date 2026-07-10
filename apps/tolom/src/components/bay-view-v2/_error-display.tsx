"use client";

import type { ReactNode } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

// ── BayViewErrorState — full-page error with retry ──────────────

interface BayViewErrorStateProps {
  error: string | null;
  t: (key: string) => string;
  fetchData: (showLoader: boolean) => Promise<void>;
}

export function BayViewErrorState({
  error,
  t,
  fetchData,
}: BayViewErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 min-h-[400px]">
      <Typography.Muted className="text-base text-muted-foreground">
        {error
          ? "Couldn't load bay view. Check your internet connection."
          : t("noData")}
      </Typography.Muted>
      <Button
        variant="outline"
        size="sm"
        onClick={() => fetchData(true)}
        className="rounded-lg shadow-sm font-semibold"
      >
        {t("retry")}
      </Button>
    </div>
  );
}

// ── ErrorSection — granular error boundary wrapper ──────────────

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
