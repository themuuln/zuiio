"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { DashboardData } from "@/lib/types";

export const MechanicTrendChart = dynamic(
  () => import("./_charts-content").then((m) => m.MechanicTrendChart),
  { ssr: false },
);

const ChartsSectionContent = dynamic(
  () => import("./_charts-content").then((m) => m.default),
  { ssr: false },
);

const STORAGE_KEY = "dashboard-charts-collapsed";

export default function ChartsSection({ data }: { data: DashboardData }) {
  const t = useTranslations() as (key: string, values?: Record<string, string | number>) => string;
  const [collapsed, setCollapsed] = useState(false);

  // Restore state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) setCollapsed(stored === "true");
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          className="rounded-xl px-2 text-muted-foreground hover:text-foreground"
          aria-expanded={!collapsed}
          aria-controls="charts-content"
        >
          {collapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
          <span className="text-sm font-medium">
            {t("dashboard.insightsAndTrends")}
          </span>
        </Button>
      </div>
      {!collapsed && (
        <div id="charts-content">
          <ChartsSectionContent data={data} />
        </div>
      )}
    </div>
  );
}
