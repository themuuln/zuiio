"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

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
        <h2 className="text-2xl font-semibold text-destructive">
          Алдаа гарлаа
        </h2>
        <p className="text-muted-foreground">
          Уучлаарай, системийн алдаа гарлаа. Дахин оролдоно уу.
        </p>
        <Button onClick={() => reset()} variant="default">
          Дахин оролдох
        </Button>
      </div>
    </div>
  );
}
