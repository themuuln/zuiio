"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

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
          <h1 className="text-4xl font-semibold text-destructive">Something went wrong!</h1>
          <p className="text-muted-foreground">
            A critical error occurred. Please try refreshing the page.
          </p>
          <Button onClick={() => reset()} variant="default">
            Try Again
          </Button>
        </div>
      </body>
    </html>
  );
}
