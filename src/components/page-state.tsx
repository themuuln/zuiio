"use client";

import {
  AlertCircle,
  FileSearch,
  type LucideIcon,
  RefreshCw,
  Search,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

// ─── Base State ───────────────────────────────────────────────

interface PageStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
}

function BasePageState({
  title,
  description,
  icon: Icon,
  action,
  className,
}: PageStateProps) {
  return (
    <Empty
      className={cn(
        "min-h-[320px] rounded-2xl border border-border/70 bg-card px-6 py-10",
        className,
      )}
    >
      <EmptyHeader>
        {Icon ? (
          <EmptyMedia variant="icon">
            <Icon className="size-4" />
          </EmptyMedia>
        ) : null}
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}

// ─── Error State ──────────────────────────────────────────────

export function PageErrorState({
  title,
  description,
  onRetry,
  className,
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
  className?: string;
}) {
  const t = useTranslations("common");

  return (
    <BasePageState
      title={title ?? t("somethingWentWrong")}
      description={description}
      icon={AlertCircle}
      className={className}
      action={
        onRetry ? (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="size-4" />
            {t("retry")}
          </Button>
        ) : null
      }
    />
  );
}

/**
 * Inline error banner for pages that need to show the header + error inline.
 * Renders an error message in a destructive-styled card with a Retry button.
 */
export function InlineErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0 text-destructive" />
          <Typography.Text className="text-sm text-destructive">
            {message}
          </Typography.Text>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="size-3.5" />
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Not Found State ──────────────────────────────────────────

export function PageNotFoundState({
  title,
  description,
  action,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  const t = useTranslations("common");

  return (
    <BasePageState
      title={title ?? t("pageNotFound")}
      description={description ?? t("pageNotFoundDescription")}
      icon={FileSearch}
      action={action}
      className={className}
    />
  );
}

// ─── Loading States ───────────────────────────────────────────

export function PageShellSkeleton({
  className,
  cards = 3,
}: {
  className?: string;
  cards?: number;
}) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48 max-w-full" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: cards }).map((_, index) => (
          <Skeleton
            key={`page-shell-skeleton-${index + 1}`}
            className="h-28 rounded-xl"
          />
        ))}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}

/**
 * Skeleton for list pages with search bar and table.
 *
 * @example
 * ```tsx
 * <ListPageSkeleton rows={5} />
 * ```
 */
export function ListPageSkeleton({
  rows = 5,
  showSearch = true,
  className,
}: {
  rows?: number;
  showSearch?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-col gap-1">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-36" />
      </div>
      {showSearch && <Skeleton className="h-10 w-full" />}
      <div className="divide-y divide-border rounded-lg border">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={`list-skeleton-row-${i}`}
            className="flex items-center gap-4 p-4"
          >
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="h-5 w-24 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for table-based list pages that use the DataTable component.
 * Shows exactly the DataTable skeleton which handles its own row rendering.
 *
 * @example
 * ```tsx
 * <DataTableSkeleton columns={5} rows={8} />
 * ```
 */
export function DataTableSkeleton({
  columns = 4,
  rows = 5,
  className,
}: {
  columns?: number;
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton className="h-10 w-full max-w-sm" />
      <div className="divide-y divide-border rounded-lg border">
        {Array.from({ length: rows }).map((_, ri) => (
          <div key={`dts-${ri}`} className="flex items-center gap-4 p-4">
            {Array.from({ length: columns }).map((_, ci) => (
              <Skeleton key={`dts-${ri}-${ci}`} className="h-5 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
