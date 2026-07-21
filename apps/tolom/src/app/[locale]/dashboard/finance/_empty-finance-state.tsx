"use client";

import { DollarSign } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function EmptyFinanceState() {
  const t = useTranslations("finance") as (key: string, values?: Record<string, string | number>) => string;
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <DollarSign />
        </EmptyMedia>
        <EmptyTitle>{t("noFinancialData")}</EmptyTitle>
        <EmptyDescription>{t("noFinancialDataDesc")}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
