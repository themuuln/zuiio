"use client";

import { Button } from "@/components/ui/button";

export default function BranchesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <p className="text-sm text-destructive">
        Салбаруудын мэдээллийг ачаалахад алдаа гарлаа.
      </p>
      <p className="text-xs text-muted-foreground">{error.message}</p>
      <Button variant="outline" size="sm" onClick={reset}>
        Дахин оролдох
      </Button>
    </div>
  );
}
