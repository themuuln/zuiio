"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

interface UnsavedWarningProps {
  show: boolean;
  onDiscard: () => void;
  onKeepEditing: () => void;
}

export function UnsavedWarning({ show, onDiscard, onKeepEditing }: UnsavedWarningProps) {
  if (!show) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-300">
      <div className="mx-4 flex w-full max-w-sm flex-col items-center gap-4 rounded-lg border border-border bg-card p-6 shadow-lg">
        <AlertTriangle className="size-8 text-amber-500" />
        <div className="text-center">
          <Typography.Text className="font-semibold">You have unsaved changes</Typography.Text>
          <Typography.Muted className="mt-1 text-sm text-muted-foreground">
            Are you sure you want to close? Your changes will be lost.
          </Typography.Muted>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onDiscard}
            className="h-8 text-xs"
          >
            Discard
          </Button>
          <Button
            size="sm"
            onClick={onKeepEditing}
            className="h-8 text-xs"
          >
            Keep editing
          </Button>
        </div>
      </div>
    </div>
  );
}
