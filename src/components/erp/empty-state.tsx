import Link from "next/link";
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

export function ErpEmptyState({
  icon,
  title,
  description,
  actionHref,
  actionLabel,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  /** Custom action element, overrides actionHref + actionLabel */
  action?: ReactNode;
}) {
  return (
    <Empty className="min-h-72 rounded-3xl border border-dashed border-border bg-card/90 shadow-sm backdrop-blur-sm">
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action ? (
        <EmptyContent>{action}</EmptyContent>
      ) : actionHref && actionLabel ? (
        <EmptyContent>
          <Button render={<Link href={actionHref} />}>{actionLabel}</Button>
        </EmptyContent>
      ) : null}
    </Empty>
  );
}
