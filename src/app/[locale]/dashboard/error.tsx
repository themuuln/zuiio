"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { PageErrorState } from "@/components/page-state";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageErrorState
      title={t("somethingWentWrong")}
      description={error.message || t("unexpectedError")}
      onRetry={reset}
    />
  );
}
