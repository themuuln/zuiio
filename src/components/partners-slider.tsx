"use client";

import { ExternalLink } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

export function PartnersSlider() {
  const t = useTranslations("home");

  return (
    <section className="overflow-hidden border-b bg-muted/30 px-4 py-12 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <Typography.Muted className="mb-8 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {t("partnersTitle")}
        </Typography.Muted>

        {/* Founding org feature */}
        <div className="mx-auto max-w-md">
          <div className="flex flex-col items-center gap-4 rounded-xl border bg-background p-6 shadow-xs">
            {/* Logo */}
            <div className="relative size-20 overflow-hidden rounded-full border">
              <Image
                src="/khantaishir-motors-logo.jpg"
                alt="Хантайшир Моторс ХХК"
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>

            {/* Org info */}
            <div className="text-center">
              <Typography.H3 className="text-lg font-semibold">
                Хантайшир Моторс ХХК
              </Typography.H3>
              <Typography.Muted className="mt-1 text-xs text-muted-foreground">
                {t("partnersOrgDesc")}
              </Typography.Muted>
            </div>

            {/* Facebook link */}
            <Button
              variant="outline"
              size="sm"
              render={
                <a
                  href="https://www.facebook.com/khantaishiravtoservice"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
              nativeButton={false}
              className="gap-2"
            >
              <ExternalLink className="size-4" />
              Facebook
            </Button>
          </div>
        </div>

        {/* Coming soon badge */}
        <div className="mt-8 text-center">
          <Badge
            variant="secondary"
            className="px-4 py-1.5 text-xs font-medium"
          >
            {t("partnersComingSoon")}
          </Badge>
        </div>
      </div>
    </section>
  );
}
