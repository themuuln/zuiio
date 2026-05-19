"use client";

import { Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const t = useTranslations();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <div className="flex items-center gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Settings2 className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("nav.settings")}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Manage your shop defaults, appearance, and billing preferences.
            </p>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
