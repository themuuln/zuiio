"use client";

import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

export type CreatePageHeaderProps = {
  backHref: string;
  title: string;
  subtitle?: string;
  className?: string;
  /** Optional action buttons rendered on the right side */
  actions?: ReactNode;
};

export function CreatePageHeader({
  backHref,
  title,
  subtitle,
  className,
  actions,
}: CreatePageHeaderProps) {
  const t = useTranslations("common");
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Button
        render={<Link href={backHref} />}
        variant="ghost"
        size="icon-xs"
        aria-label={t("back")}
      >
        <ArrowLeft className="size-5" />
      </Button>
      <div className="flex-1 min-w-0">
        <Typography.H1 className="text-2xl font-semibold tracking-tight">
          {title}
        </Typography.H1>
        {subtitle && (
          <Typography.Muted className="text-sm text-muted-foreground">
            {subtitle}
          </Typography.Muted>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}
