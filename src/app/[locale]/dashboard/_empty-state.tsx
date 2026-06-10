"use client";

import { Plus, Wrench } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function EmptyDashboardState({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Wrench />
        </EmptyMedia>
        <EmptyTitle>{t("welcome")}</EmptyTitle>
        <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-3">
          <Link href="/dashboard/work-orders/new">
            <Button>
              <Plus className="size-4" />
              {t("createFirstWorkOrder")}
            </Button>
          </Link>
          <Button variant="outline" onClick={onRetry}>
            {tc("refresh")}
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  );
}
