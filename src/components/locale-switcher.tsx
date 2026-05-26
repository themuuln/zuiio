"use client";

import { useLocale } from "next-intl";
import { setCookie } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function LocaleSwitcher() {
  const locale = useLocale();

  const handleSwitch = (newLocale: "mn" | "en") => {
    if (newLocale === locale) return;
    setCookie("NEXT_LOCALE", newLocale, 365);
    window.location.reload();
  };

  return (
    <div className="flex gap-0.5">
      <Button
        variant={locale === "mn" ? "default" : "ghost"}
        size="xs"
        onClick={() => handleSwitch("mn")}
        className="h-7 min-w-8 px-2 text-[11px] font-medium"
      >
        MN
      </Button>
      <Button
        variant={locale === "en" ? "default" : "ghost"}
        size="xs"
        onClick={() => handleSwitch("en")}
        className="h-7 min-w-8 px-2 text-[11px] font-medium"
      >
        EN
      </Button>
    </div>
  );
}
