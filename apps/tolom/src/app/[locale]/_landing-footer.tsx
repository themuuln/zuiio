"use client";

import { Wrench } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Typography } from "@/components/ui/typography";

export function LandingFooter() {
  const t = useTranslations("home");
  const appT = useTranslations("app");

  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-semibold"
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary shadow-xs">
                <Wrench className="size-4 text-primary-foreground" />
              </div>
              <span>{appT("name")}</span>
            </Link>
            <Typography.Muted className="text-xs text-muted-foreground">
              {t("footerTagline")}
            </Typography.Muted>
            <div className="mt-2">
              <LocaleSwitcher />
            </div>
          </div>

          {/* Product */}
          <div className="flex flex-col gap-3">
            <Typography.H4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("footerProduct")}
            </Typography.H4>
            <ul className="flex flex-col gap-2">
              {(["Features", "Pricing", "Integrations"] as const).map((item) => (
                <li key={item}>
                  <Link
                    href={
                      item === "Pricing"
                        ? "/pricing"
                        : item === "Integrations"
                          ? "/integrations"
                          : "#features"
                    }
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t(`footerProduct${item}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="flex flex-col gap-3">
            <Typography.H4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("footerCompany")}
            </Typography.H4>
            <ul className="flex flex-col gap-2">
              {(["About", "Blog", "Contact"] as const).map((item) => (
                <li key={item}>
                  <Link
                    href={
                      item === "About"
                        ? "/about"
                        : item === "Blog"
                          ? "/blog"
                          : "/auth/login"
                    }
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t(`footerCompany${item}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="flex flex-col gap-3">
            <Typography.H4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("footerSupport")}
            </Typography.H4>
            <ul className="flex flex-col gap-2">
              {(["Docs", "FAQ", "Status"] as const).map((item) => (
                <li key={item}>
                  <Link
                    href={
                      item === "FAQ"
                        ? "/faq"
                        : item === "Status"
                          ? "/status"
                          : item === "Docs"
                            ? "/guide"
                            : "/auth/login"
                    }
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t(`footerSupport${item}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t pt-6 text-center text-xs text-muted-foreground">
          {t("footerCopyright")}
        </div>
      </div>
    </footer>
  );
}
