import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

interface PublicEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  children?: ReactNode;
  className?: string;
}

export function PublicEmptyState({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
  children,
  className,
}: PublicEmptyStateProps) {
  return (
    <Empty className={cn("border", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {children || (actionHref && actionLabel) ? (
        <EmptyContent>
          {children}
          {actionHref && actionLabel ? (
            <Button>
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          ) : null}
        </EmptyContent>
      ) : null}
    </Empty>
  );
}
