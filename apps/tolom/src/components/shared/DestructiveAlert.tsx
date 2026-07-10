"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

interface DestructiveAlertProps {
  message: string;
  onRetry?: () => void;
}

/**
 * Reusable error/alert banner for destructive or error states.
 * Inherits the bay-view-v2 red-alert pattern.
 */
export function DestructiveAlert({ message, onRetry }: DestructiveAlertProps) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/40 p-3">
      <AlertTriangle className="mt-1 size-4 shrink-0 text-red-500" />
      <div className="flex flex-col gap-1 min-w-0">
        <Typography.Text className="text-xs text-red-700 dark:text-red-400">
          {message}
        </Typography.Text>
        {onRetry && (
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="rounded-lg font-semibold"
            >
              Retry
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
