"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LocaleErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-semibold text-destructive/30">500</h1>
        <h2 className="mt-4 text-xl font-semibold">Алдаа гарлаа</h2>
        <p className="mt-2 text-muted-foreground">
          Уучлаарай, системийн алдаа гарлаа. Дахин оролдоно уу.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button onClick={reset} variant="default">
            Дахин оролдох
          </Button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Хяналтын самбар
          </Link>
        </div>
      </div>
    </div>
  );
}
