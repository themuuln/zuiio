"use client";

import { ArrowClockwise, WarningCircle } from "@phosphor-icons/react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { capture } from "@zuiio/capture";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    capture(error, { context: "root error boundary" });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/15">
          <WarningCircle className="size-7 text-destructive" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">Алдаа гарлаа</h1>
        <p className="mb-6 text-muted-foreground">
          Уучлаарай, системд гэнэтийн алдаа гарлаа. Та дахин оролдоно уу.
        </p>
        <Button onClick={reset}>
          <ArrowClockwise className="mr-2 size-4" />
          Дахин оролдох
        </Button>
      </div>
    </div>
  );
}
