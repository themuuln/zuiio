"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { PageErrorState } from "@/components/page-state";
import { reportError } from "@/lib/sentry-report";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");

  useEffect(() => {
    reportError(error, "dashboard");
  }, [error]);

  return (
    <PageErrorState
      title={t("somethingWentWrong")}
      description={error.message || t("unexpectedError")}
      onRetry={reset}
    />
  );
}
