"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center flex flex-col gap-4 p-8">
          <Typography.H1 className="text-4xl font-semibold text-destructive">
            Something went wrong!
          </Typography.H1>
          <Typography.Muted className="text-muted-foreground">
            A critical error occurred. Please try refreshing the page.
          </Typography.Muted>
          <Button onClick={() => reset()} variant="default">
            Try Again
          </Button>
        </div>
      </body>
    </html>
  );
}
