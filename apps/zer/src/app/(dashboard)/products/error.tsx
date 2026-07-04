"use client";

import { ArrowClockwise, WarningCircle } from "@phosphor-icons/react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { capture } from "@zuiio/capture";

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    capture(error, { context: "products error boundary" });
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-16">
      <div className="mx-auto flex max-w-sm flex-col items-center text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/15">
          <WarningCircle className="size-7 text-destructive" />
        </div>
        <h2 className="mb-2 text-xl font-semibold">Алдаа гарлаа</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Бүтээгдэхүүний жагсаалтыг ачаалахад алдаа гарлаа. Та дахин оролдоно
          уу.
        </p>
        <Button onClick={reset} size="sm">
          <ArrowClockwise className="mr-2 size-4" />
          Дахин оролдох
        </Button>
      </div>
    </div>
  );
}
