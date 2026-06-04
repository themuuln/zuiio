"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center flex flex-col gap-4">
        <Typography.H2 className="text-2xl font-semibold text-destructive">
          Алдаа гарлаа
        </Typography.H2>
        <Typography.Muted className="text-muted-foreground">
          {error.message ||
            "Уучлаарай, системийн алдаа гарлаа. Дахин оролдоно уу."}
        </Typography.Muted>
        {error.digest && (
          <Typography.Muted className="text-xs text-muted-foreground">
            Error ID: {error.digest}
          </Typography.Muted>
        )}
        <Button onClick={() => reset()} variant="default">
          Дахин оролдох
        </Button>
      </div>
    </div>
  );
}
