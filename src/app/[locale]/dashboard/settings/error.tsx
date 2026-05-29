"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

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
      <div className="text-center flex flex-col gap-4">
        <Typography.H2 className="text-2xl font-semibold text-destructive">
          Алдаа гарлаа
        </Typography.H2>
        <Typography.Muted className="text-muted-foreground">
          Уучлаарай, системийн алдаа гарлаа. Дахин оролдоно уу.
        </Typography.Muted>
        <Button onClick={() => reset()} variant="default">
          {t("common.retry")}
        </Button>
      </div>
    </div>
  );
}
