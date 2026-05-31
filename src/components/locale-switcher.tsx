"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setCookie } from "@/lib/utils";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSwitch = (newLocale: "mn" | "en") => {
    if (newLocale === locale || isPending) return;
    setCookie("NEXT_LOCALE", newLocale, 365);
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="flex gap-0.5">
      <Button
        variant={locale === "mn" ? "default" : "ghost"}
        size="xs"
        onClick={() => handleSwitch("mn")}
        disabled={isPending}
        className="h-7 min-w-8 px-2 text-[11px] font-medium"
      >
        MN
      </Button>
      <Button
        variant={locale === "en" ? "default" : "ghost"}
        size="xs"
        onClick={() => handleSwitch("en")}
        disabled={isPending}
        className="h-7 min-w-8 px-2 text-[11px] font-medium"
      >
        EN
      </Button>
    </div>
  );
}
