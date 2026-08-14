"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { SettingsSection } from "./_settings-sections";

interface SettingsSubSidebarProps {
  readonly activeSection: string;
  readonly currency: string;
  readonly language: string;
  readonly onSelect: (value: string) => void;
  readonly organizationName: string;
  readonly sections: readonly SettingsSection[];
  readonly timezone: string;
}

export function SettingsSubSidebar({
  activeSection,
  currency,
  language,
  onSelect,
  organizationName,
  sections,
  timezone,
}: SettingsSubSidebarProps) {
  const t = useTranslations("settings") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;

  const orgInitials = organizationName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <nav
      className="sticky top-20 hidden w-10 shrink-0 flex-col items-center gap-0.5 self-start rounded-lg border border-border py-2 sm:flex"
      aria-label={t("navTitle")}
    >
      {sections.map((section) => {
        const Icon = section.icon;
        const isActive = activeSection === section.value;

        return (
          <Tooltip key={section.value}>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onSelect(section.value)}
                  aria-label={section.title}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "rounded-lg",
                    isActive
                      ? "border border-foreground/10 bg-foreground/8 text-foreground"
                      : "border border-transparent bg-transparent text-muted-foreground/55 hover:border-border/70 hover:bg-accent/70 hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                </Button>
              }
            />
            <TooltipContent side="right" sideOffset={8}>
              {section.title}
            </TooltipContent>
          </Tooltip>
        );
      })}

      <Separator className="my-1 w-6" />

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-lg border border-transparent bg-transparent text-[10px] font-bold text-muted-foreground/55 hover:border-border/70 hover:bg-accent/70 hover:text-foreground"
              aria-label={t("workspaceDefaults")}
            >
              {orgInitials}
            </Button>
          }
        />
        <TooltipContent side="right" sideOffset={8}>
          <div className="flex flex-col gap-0.5 text-xs">
            <span className="font-medium">{organizationName}</span>
            <span className="text-muted-foreground">
              {[language, timezone.replace(/_/g, " "), currency]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </div>
        </TooltipContent>
      </Tooltip>
    </nav>
  );
}
