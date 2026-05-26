"use client";

import { useTranslations } from "next-intl";
import { PageNotFoundState } from "@/components/page-state";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";

export default function LocaleNotFound() {
  const t = useTranslations("common");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl px-4 py-10 sm:px-6">
      <PageNotFoundState
        action={
          <Button render={<Link href="/" />} nativeButton={false}>
            {t("returnHome")}
          </Button>
        }
        className="my-auto"
      />
    </div>
  );
}
