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
        <Typography.H2 className="text-2xl font-semibold text-destructive">Something went wrong!</Typography.H2>
        <Typography.Muted className="text-muted-foreground">An unexpected error occurred. Please try again.</Typography.Muted>
        <Button onClick={() => reset()} variant="default">
          Try Again
        </Button>
      </div>
    </div>
  );
}
