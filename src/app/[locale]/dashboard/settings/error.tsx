"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();

  useEffect(() => {
    console.error("Settings page error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold text-destructive">Алдаа гарлаа</h2>
        <p className="text-muted-foreground">
          Уучлаарай, системийн алдаа гарлаа. Дахин оролдоно уу.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t("common.retry")}
        </button>
      </div>
    </div>
  );
}
