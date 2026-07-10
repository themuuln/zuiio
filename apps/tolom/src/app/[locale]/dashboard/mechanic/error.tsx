"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { reportError } from "@/lib/sentry-report";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, "dashboard/mechanic");
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center flex flex-col gap-4">
        <Typography.H2 className="text-2xl font-semibold text-destructive">
          Алдаа гарлаа
        </Typography.H2>
        <Typography.Muted className="text-muted-foreground">
          Уучлаарай, системийн алдаа гарлаа. Дахин оролдоно уу.
        </Typography.Muted>
        <Button onClick={() => reset()} variant="default">
          Дахин оролдох
        </Button>
      </div>
    </div>
  );
}
