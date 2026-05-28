"use client";

import { useTranslations } from "next-intl";
import { Typography } from "@/components/ui/typography";

const PARTNERS = Array.from({ length: 12 }, (_, i) => `partner_${i + 1}`);

export function PartnersSlider() {
  const t = useTranslations("home");

  return (
    <section className="overflow-hidden border-b bg-muted/30 px-4 py-12 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <Typography.Muted className="mb-8 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {t("partnersTitle")}
        </Typography.Muted>

        {/* Sliding track — two copies for seamless infinite loop */}
        <div className="relative mx-auto max-w-5xl overflow-hidden">
          <div className="flex animate-marquee gap-6">
            {[...PARTNERS, ...PARTNERS].map((name, i) => (
              <div
                key={`${name}_${i}`}
                className="flex h-16 w-44 shrink-0 items-center justify-center rounded-xl border bg-background shadow-xs"
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="size-6 rounded-md bg-muted-foreground/10" />
                  <span className="text-xs font-medium text-muted-foreground/60">
                    {name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
