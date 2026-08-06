"use client";

import { WifiSlash } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";

export default function OfflinePage() {
  const { t } = useI18n();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted">
        <WifiSlash className="size-8 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("offline.page.title")}
        </h1>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          {t("offline.page.description")}
        </p>
      </div>
      <Button type="button" onClick={() => window.location.reload()}>
        {t("offline.page.retry")}
      </Button>
    </main>
  );
}
