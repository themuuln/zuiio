"use client";

import { ChevronDown, ChevronUp, Users, Wrench } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Profile } from "@/lib/database.types";
import { MechanicChip } from "./mechanic-chip";

interface MechanicRosterProps {
  mechanics: (Profile & { current_jobs: number })[];
}

export function MechanicRoster({ mechanics }: MechanicRosterProps) {
  const t = useTranslations("bayView");
  const [collapsed, setCollapsed] = useState(false);
  const activeMechanics = mechanics.filter((m) => m.current_jobs > 0);
  const availableMechanics = mechanics.filter((m) => m.current_jobs === 0);

  return (
    <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-muted/30 transition-colors"
      >
        <span className="flex items-center gap-2">
          <div className="flex items-center justify-center size-7 rounded-lg bg-blue-500/10">
            <Users className="size-3.5 text-blue-500" />
          </div>
          <span>{t("mechanics")}</span>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
            {mechanics.length}
          </span>
        </span>
        {collapsed ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </button>

      {!collapsed && (
        <div className="px-3 pb-3 space-y-3">
          {mechanics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2 text-muted-foreground/50">
              <Wrench className="size-6" />
              <p className="text-xs">{t("noMechanics")}</p>
            </div>
          ) : (
            <>
              {activeMechanics.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-1">
                    {t("working", { count: activeMechanics.length })}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {activeMechanics.map((m) => (
                      <MechanicChip key={m.id} mechanic={m} />
                    ))}
                  </div>
                </div>
              )}
              {availableMechanics.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-1">
                    {t("available", { count: availableMechanics.length })}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {availableMechanics.map((m) => (
                      <MechanicChip key={m.id} mechanic={m} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
