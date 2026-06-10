"use client";

import { AlertTriangle, BellOff, Calendar, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";

interface SummaryCardsProps {
  counts: {
    total: number;
    overdue: number;
    dueSoon: number;
    remindersOff: number;
  };
}

export function SummaryCards({ counts }: SummaryCardsProps) {
  const t = useTranslations();

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Card className="py-3">
        <CardContent className="flex items-center gap-3 p-0 px-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Calendar className="size-4 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-semibold leading-none">{counts.total}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("serviceReminders.totalSchedules")}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="py-3">
        <CardContent className="flex items-center gap-3 p-0 px-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
            <AlertTriangle className="size-4 text-destructive" />
          </div>
          <div>
            <p className="text-2xl font-semibold leading-none text-destructive">
              {counts.overdue}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("serviceReminders.overdueCount")}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="py-3">
        <CardContent className="flex items-center gap-3 p-0 px-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
            <Clock className="size-4 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-semibold leading-none text-amber-600">
              {counts.dueSoon}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("serviceReminders.dueSoonCount")}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="py-3">
        <CardContent className="flex items-center gap-3 p-0 px-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <BellOff className="size-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-2xl font-semibold leading-none">
              {counts.remindersOff}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("serviceReminders.remindersOff")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
