"use client";

import { useCallback, useMemo, useState } from "react";
import { BayGrid } from "./_bay-grid";
import { FilterBar } from "./_filter-bar";
import { KPIStrip } from "./_kpi-strip";
import { MOCK_BAYS } from "./_mock-data";
import type { Bay, BayFilter } from "./types";
import { BAY_STATUSES } from "./types";

// ─── BayViewV3 ────────────────────────────────────────────
// Main client component. Assembles the full bay view using
// layout-builder primitives in a Stack composition:
//
//   Dashboard Shell
//   ├── KPI Strip     (Switcher — flex-wrap row)
//   ├── Filter Bar    (Cluster — inline pills)
//   └── Bay Grid      (Auto-fill Grid)
//
// Every section lives in a space-y-6 Stack for vertical rhythm.

interface BayViewV3Props {
  /** Injected bays — falls back to mock data for standalone use */
  bays?: Bay[];
}

export function BayViewV3({ bays: baysProp }: BayViewV3Props) {
  const bays = baysProp ?? MOCK_BAYS;

  const [activeFilter, setActiveFilter] = useState<BayFilter>("all");
  const [selectedBayId, setSelectedBayId] = useState<string | null>(null);

  // ── Filtered bays ──────────────────────────────────────
  const filteredBays = useMemo(() => {
    if (activeFilter === "all") return bays;
    return bays.filter((b) => b.status === activeFilter);
  }, [bays, activeFilter]);

  // ── Bay counts per status ──────────────────────────────
  const bayCounts = useMemo(() => {
    const counts = { all: bays.length } as Record<BayFilter, number>;
    for (const s of BAY_STATUSES) {
      counts[s] = bays.filter((b) => b.status === s).length;
    }
    return counts;
  }, [bays]);
  // ── Computed KPIs from bay data ───────────────────────
  const kpis = useMemo(() => {
    const total = bays.length;
    const inProgress = bays.filter((b) => b.status === "in-progress").length;
    const waiting = bays.filter((b) => b.status === "waiting").length;
    const ready = bays.filter((b) => b.status === "ready-for-pickup").length;
    const empty = bays.filter((b) => b.status === "empty").length;
    return [
      { label: "Нийт бэй", value: total, icon: "◻" },
      { label: "Ажиллаж байна", value: inProgress, icon: "●" },
      { label: "Хүлээж байна", value: waiting, icon: "◉" },
      { label: "Бэлэн", value: ready, icon: "✓" },
      { label: "Элбэгээрүүлсэн", value: empty, icon: "○" },
    ];
  }, [bays]);

  // ── Handlers ───────────────────────────────────────────
  const handleSelectBay = useCallback((bayId: string) => {
    setSelectedBayId((prev) => (prev === bayId ? null : bayId));
  }, []);

  const handleBayAction = useCallback((_bayId: string, _action: string) => {
    // TODO: wire to real mutations
  }, []);

  // Layout Builder: Stack primitive — space-y-6 for vertical rhythm
  return (
    <div className="flex h-full flex-col overflow-hidden p-4 sm:p-6">
      <div className="flex-1 space-y-6 overflow-y-auto">
        {/* ── KPI Strip (Switcher primitive) ──────────────── */}
        <KPIStrip kpis={kpis} />

        {/* ── Filter Bar (Cluster primitive) ─────────────── */}
        <FilterBar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          bayCounts={bayCounts}
        />

        {/* ── Bay Grid (Auto-fill Grid primitive) ────────── */}
        <BayGrid
          bays={filteredBays}
          selectedBayId={selectedBayId}
          onSelectBay={handleSelectBay}
          onBayAction={handleBayAction}
        />
      </div>
    </div>
  );
}
