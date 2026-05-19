"use client";

import { useEffect } from "react";

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
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold text-destructive">Алдаа гарлаа</h2>
        <p className="text-muted-foreground">Уучлаарай, системийн алдаа гарлаа. Дахин оролдоно уу.</p>
        <button
          type="button"
  onClick={() => reset()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Дахин оролдох
        </button>
      </div>
    </div>
  );
}
