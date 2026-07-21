"use client";

import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { reportError } from "@/lib/sentry-report";

export default function PartDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const commonT = useTranslations("common") as (key: string, values?: Record<string, string | number>) => string;
  useEffect(() => {
    reportError(error, "dashboard/inventory/parts/[partId]");
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <AlertCircle className="size-12 text-muted-foreground/40" />
      <h2 className="text-xl font-semibold">{commonT("somethingWentWrong")}</h2>
      <p className="text-sm text-muted-foreground max-w-md text-center">
        {error.message ?? commonT("pageNotFoundDescription")}
      </p>
      <Button variant="outline" onClick={reset}>
        {commonT("retry")}
      </Button>
    </div>
  );
}
