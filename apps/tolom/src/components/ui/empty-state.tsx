"use client";

import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="flex items-center justify-center size-16 rounded-full bg-muted/50">
        {icon ?? <Inbox className="size-8 text-muted-foreground/40" />}
      </div>
      <div className="text-center max-w-sm">
        <Typography.Text className="font-medium text-foreground">
          {title}
        </Typography.Text>
        {description && (
          <Typography.Muted className="text-sm text-muted-foreground mt-1">
            {description}
          </Typography.Muted>
        )}
      </div>
      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
