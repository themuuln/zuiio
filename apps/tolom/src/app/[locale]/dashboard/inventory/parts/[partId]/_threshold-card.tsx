"use client";

import { AlertTriangle, Check, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NumericInput } from "@/components/ui/numeric-input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSaveThreshold } from "@/lib/queries/use-thresholds";
import { reportServerError } from "@/lib/sentry-report-server";

interface ThresholdCardProps {
  orgId: string;
  partId: string;
  currentMinimum: number;
  onHand: number;
  isPending: boolean;
}

export function ThresholdCard({
  orgId,
  partId,
  currentMinimum,
  onHand,
  isPending,
}: ThresholdCardProps) {
  const t = useTranslations("inventory") as (key: string, values?: Record<string, string | number>) => string;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentMinimum);

  const saveThreshold = useSaveThreshold(orgId);

  const handleSave = async () => {
    try {
      await saveThreshold.mutateAsync({
        partId,
        minimumQuantity: value,
      });
      setEditing(false);
    } catch (err) {
      reportServerError("Unexpected error", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to save threshold",
      );
    }
  };

  const isLow = onHand < currentMinimum && onHand > 0;
  const isOut = onHand <= 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">
          {t("stockThreshold")}
        </CardTitle>
        {!editing && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              setValue(currentMinimum);
              setEditing(true);
            }}
          >
            <Pencil className="size-3.5" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {isPending ? (
          <Skeleton className="h-10 w-full" />
        ) : editing ? (
          <div className="flex items-center gap-2">
            <NumericInput
              value={value}
              onChange={(qty) => setValue(Math.round(qty))}
              className="h-10 w-24 text-center"
              min={0}
              autoFocus
            />
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={saveThreshold.isPending}
            >
              <Check className="size-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold tabular-nums">
                {currentMinimum}
              </span>
              <span className="text-sm text-muted-foreground">
                units minimum
              </span>
              {(isLow || isOut) && (
                <Badge
                  variant="outline"
                  className={
                    isOut
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }
                >
                  <AlertTriangle className="size-3 mr-1" />
                  {isOut ? t("outOfStock") : t("lowStock")}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-[width,background-color] duration-500 ease-out-quart ${
                    isOut
                      ? "bg-red-500"
                      : isLow
                        ? "bg-amber-500"
                        : "bg-green-500"
                  }`}
                  style={{
                    width: `${Math.min(100, (onHand / Math.max(currentMinimum, 1)) * 100)}%`,
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                {onHand} / {currentMinimum}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
