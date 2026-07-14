import type * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PageShellProps {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** True while initial data is loading (shows skeleton in place of header) */
  loading?: boolean;
  /** Error message to show as inline banner (does not replace page content) */
  error?: string | null;
  /** Called when user clicks retry after an error */
  onRetry?: () => void;
}

/**
 * Page-level layout wrapper for list/detail pages.
 *
 * PPR pattern: always renders the outer structure (header + content area).
 * When `loading` is true, the title/description/actions show skeleton placeholders
 * but the children (card, table, etc.) still render — they handle their own
 * inline loading states. When `error` is set, it shows as an inline banner
 * above the content, never replacing the page structure.
 */
export function PageShell({
  title,
  description,
  actions,
  children,
  className,
  loading = false,
  error = null,
  onRetry,
}: PageShellProps) {
  return (
    <div className={cn("flex flex-1 flex-col gap-6", className)}>
      {/* ── Header: always rendered (skeleton on first load) ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          {loading ? (
            <>
              <Skeleton className="h-7 w-48 sm:h-8" />
              {description && <Skeleton className="h-4 w-64" />}
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {title}
              </h1>
              {description && (
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {description}
                </p>
              )}
            </>
          )}
        </div>
        {actions &&
          (loading ? (
            <Skeleton className="h-9 w-36" />
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 [&>*]:w-full [&>*]:sm:w-auto">
              {actions}
            </div>
          ))}
      </div>

      {/* ── Error banner (inline, never replaces page structure) ── */}
      {error && (
        <div
          className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          <svg
            className="size-5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          <span className="flex-1">{error}</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="shrink-0 rounded-md border border-destructive/30 px-3 py-1 text-xs font-medium hover:bg-destructive/10 transition-colors"
            >
              Дахин оролдох
            </button>
          )}
        </div>
      )}

      {/* ── Content: always rendered — children handle their own inline loading/empty states ── */}
      {children}
    </div>
  );
}
