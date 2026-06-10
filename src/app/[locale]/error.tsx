"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { PageErrorState } from "@/components/page-state";
import { reportError } from "@/lib/sentry-report";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, "[locale]");
  }, [error]);

  const t = useTranslations("common");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl px-4 py-10 sm:px-6">
      <PageErrorState
        title={t("somethingWentWrong")}
        description={error.message || t("unexpectedError")}
        onRetry={reset}
        className="my-auto"
      />
    </div>
  );
}
