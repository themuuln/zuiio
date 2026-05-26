"use client";

import { AlertCircle, FileSearch, type LucideIcon, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
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
import { cn } from "@/lib/utils";

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
          <Button onClick={onRetry} variant="outline">
            <RefreshCw className="size-4" />
            {t("retry")}
          </Button>
        ) : null
      }
    />
  );
}

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
