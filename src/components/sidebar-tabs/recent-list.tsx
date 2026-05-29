"use client";

import { Clock } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { Typography } from "@/components/ui/typography";

interface RecentItem {
  id: string;
  primary: string;
  secondary?: string | null;
  timestamp?: string | null;
  href?: string;
}

export function RecentList({
  items,
  title,
  loading,
  emptyMessage = "No recent items",
}: {
  items: RecentItem[];
  title?: string;
  loading?: boolean;
  emptyMessage?: string;
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-1.5">
        {title && (
          <Typography.Muted className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
            {title}
          </Typography.Muted>
        )}
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded-md bg-muted/50" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Clock />
          </EmptyMedia>
          <EmptyTitle>{emptyMessage}</EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {title && (
        <Typography.Muted className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
          {title}
        </Typography.Muted>
      )}
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "flex items-center justify-between rounded-md border border-border/50 bg-card px-2.5 py-1.5",
            item.href && "cursor-pointer hover:bg-accent/50 transition-colors",
          )}
          onClick={() => {
            if (item.href) window.location.href = item.href;
          }}
        >
          <div className="flex-1 min-w-0">
            <Typography.Text className="text-xs font-medium truncate text-foreground/90">
              {item.primary}
            </Typography.Text>
            {item.secondary && (
              <Typography.Muted className="text-[10px] text-muted-foreground/60 truncate leading-tight">
                {item.secondary}
              </Typography.Muted>
            )}
          </div>
          {item.timestamp && (
            <span className="text-[10px] text-muted-foreground/40 shrink-0 ml-2">
              {item.timestamp}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
