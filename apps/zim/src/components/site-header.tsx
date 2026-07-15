"use client";

import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link, usePathname, useRouter } from "@/i18n/navigation";

export function SiteHeader() {
  const t = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const otherLocale = locale === "mn" ? "en" : "mn";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          {t("appName")}
          <span className="text-primary">.</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/lookup" />}
          >
            🔍
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.replace(pathname, { locale: otherLocale })}
            aria-label={t("language")}
          >
            {otherLocale === "mn" ? "МН" : "EN"}
          </Button>
        </nav>
      </div>
    </header>
  );
}
