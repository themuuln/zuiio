"use client";

import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

interface BayViewErrorStateProps {
  error: string | null;
  t: (key: string) => string;
  fetchData: (showLoader: boolean) => Promise<void>;
}

export function BayViewErrorState({
  error,
  t,
  fetchData,
}: BayViewErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 min-h-[400px]">
      <Typography.Muted className="text-base text-muted-foreground">
        {error
          ? "Couldn't load bay view. Check your internet connection."
          : t("noData")}
      </Typography.Muted>
      <Button
        variant="outline"
        size="sm"
        onClick={() => fetchData(true)}
        className="rounded-lg shadow-sm font-semibold"
      >
        {t("retry")}
      </Button>
    </div>
  );
}
