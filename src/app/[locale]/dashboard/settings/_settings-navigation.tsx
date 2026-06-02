"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import type { SettingsSection } from "./_settings-sections";

interface SettingsNavigationProps {
  readonly activeSection: string;
  readonly currency: string;
  readonly language: string;
  readonly onSelect: (value: string) => void;
  readonly organizationName: string;
  readonly sections: readonly SettingsSection[];
  readonly timezone: string;
}

export function SettingsNavigation({
  activeSection,
  currency,
  language,
  onSelect,
  organizationName,
  sections,
  timezone,
}: SettingsNavigationProps) {
  const t = useTranslations("settings");

  return (
    <aside className="flex flex-col gap-4 xl:sticky xl:top-20 xl:self-start">
      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            {t("navTitle")}
          </CardTitle>
          <CardDescription className="text-xs">
            {t("navDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.value;

            return (
              <Button
                key={section.value}
                type="button"
                variant="ghost"
                className={cn(
                  "h-auto justify-start rounded-2xl border border-transparent px-3 py-3 text-left",
                  isActive
                    ? "border-border bg-muted text-foreground"
                    : "text-muted-foreground hover:border-border/70 hover:bg-muted/60 hover:text-foreground",
                )}
                onClick={() => onSelect(section.value)}
              >
                <div className="flex w-full items-start gap-3">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-background ring-1 ring-border/60">
                    <Icon className="size-4" />
                  </div>
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-sm font-medium leading-none">
                      {section.title}
                    </span>
                    <span className="line-clamp-2 text-xs text-muted-foreground">
                      {section.description}
                    </span>
                  </div>
                </div>
              </Button>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            {t("workspaceDefaults")}
          </CardTitle>
          <CardDescription className="text-xs">
            {t("workspaceDefaultsDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {[
            { label: t("orgLabel"), value: organizationName },
            { label: t("langLabel"), value: language },
            { label: t("timezoneLabel"), value: timezone },
            { label: t("currencyLabel"), value: currency },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-border/60 bg-muted/25 px-3 py-3"
            >
              <Typography.Muted className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/80">
                {item.label}
              </Typography.Muted>
              <div className="mt-1 flex items-center gap-2">
                <Typography.Text className="text-sm font-medium">
                  {item.value}
                </Typography.Text>
                {item.label === t("orgLabel") ? (
                  <Badge variant="outline">
                    {t("sectionCount", { count: sections.length })}
                  </Badge>
                ) : null}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}
