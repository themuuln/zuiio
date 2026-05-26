"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { PageErrorState } from "@/components/page-state";

export default function LocaleError({
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
