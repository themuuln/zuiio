"use client";

import { ArrowClockwise } from "@phosphor-icons/react";
import { capture } from "@zuiio/capture";
import { useEffect } from "react";
import { PageShell } from "@/components/erp/page-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function SalesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    capture(error, { context: "sales error boundary" });
  }, [error]);

  return (
    <PageShell
      title="Борлуулалт"
      description="Борлуулалтын жагсаалт, статус, төлбөрийн мэдээлэл."
      error="Борлуулалтын жагсаалтыг ачаалахад алдаа гарлаа. Та дахин оролдоно уу."
      onRetry={reset}
    >
      {/* Skeleton content — preserves page structure during error */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-28 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
        <div className="rounded-xl border">
          <div className="border-b px-6 py-4">
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="p-6">
            <div className="flex flex-col gap-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-4 w-32" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
                >
                  <ArrowClockwise className="size-4" />
                  Дахин оролдох
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
