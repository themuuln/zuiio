"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────

export interface ListPageShellProps {
  /** Page title */
  title: ReactNode;
  /** Optional subtitle / description */
  description?: ReactNode;
  /** Action button(s) in the header (e.g. "Add Customer") */
  headerAction?: ReactNode;
  /** True while initial data is loading (shows skeleton) */
  loading?: boolean;
  /** Error message to show instead of content */
  error?: string | null;
  /** Called when user clicks retry after an error */
  onRetry?: () => void;
  /** Any content: toolbar, table, KPI cards, etc. */
  children?: ReactNode;
  /** Additional class names for the outer wrapper */
  className?: string;
}

// ─── Default loading skeleton ──────────────────────────────────

export function ListPageSkeleton({
  rows = 5,
  columns = 5,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("p-4", className)}>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
          >
            {Array.from({ length: columns }).map((_, cellIdx) => (
              <Skeleton
                key={cellIdx}
                className="h-5"
                style={{ flex: cellIdx === 0 ? 2 : 1 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Default error state ───────────────────────────────────────

export function ListPageError({
  error,
  onRetry,
}: {
  error: string;
  onRetry?: () => void;
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <svg
            className="size-6"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <title>Error</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </EmptyMedia>
        <EmptyTitle>Something went wrong</EmptyTitle>
        <EmptyDescription>{error}</EmptyDescription>
      </EmptyHeader>
      {onRetry && (
        <EmptyContent>
          <Button variant="outline" onClick={onRetry}>
            Try again
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}

// ─── ListPageShell ─────────────────────────────────────────────

/**
 * Page-level layout wrapper for list pages.
 *
 * Handles:
 * - Responsive page layout (`.tablet-touch.flex.flex-col.gap-6.tablet\\:px-2`)
 * - Page header (title + description + action button)
 * - Loading skeleton (entire page during first load)
 * - Error state (centered with retry button)
 *
 * Passes through all children as-is — the page decides on Card wrappers,
 * empty states, toolbars, and table structure.
 *
 * @example
 * ```tsx
 * <ListPageShell
 *   title="Customers"
 *   description="Manage your customers"
 *   headerAction={<Button><Plus /> Add</Button>}
 *   loading={isLoading && !data}
 *   error={error?.message}
 *   onRetry={refetch}
 * >
 *   <KpiCards />
 *   <ListToolbar ... />
 *   <Card>
 *     <CardContent className="p-0">
 *       <DataTable ... />
 *     </CardContent>
 *   </Card>
 * </ListPageShell>
 * ```
 */
export function ListPageShell({
  title,
  description,
  headerAction,
  loading = false,
  error = null,
  onRetry,
  children,
  className,
}: ListPageShellProps) {
  // ── Error state ──────────────────────────────────────────
  if (error) {
    return (
      <div className={cn("flex flex-col gap-6", className)}>
        <ListPageError error={error} onRetry={onRetry} />
      </div>
    );
  }

  // ── Loading skeleton (initial load only) ─────────────────
  if (loading) {
    return (
      <div
        className={cn(
          "tablet-touch flex flex-col gap-6 tablet:px-2",
          className,
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-8 w-48" />
            {description && <Skeleton className="h-4 w-64" />}
          </div>
          {headerAction && <Skeleton className="h-10 w-36" />}
        </div>
      </div>
    );
  }

  // ── Content ─────────────────────────────────────────────
  return (
    <div
      className={cn("tablet-touch flex flex-col gap-6 tablet:px-2", className)}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <Typography.H1 className="text-2xl font-semibold tracking-tight">
            {title}
          </Typography.H1>
          {description && (
            <Typography.Muted className="text-muted-foreground">
              {description}
            </Typography.Muted>
          )}
        </div>
        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </div>

      {children}
    </div>
  );
}
