"use client";

import dynamic from "next/dynamic";
import type { DashboardData } from "@/lib/types";

export const MechanicTrendChart = dynamic(
  () => import("./_charts-content").then((m) => m.MechanicTrendChart),
  { ssr: false },
);

const ChartsSection = dynamic(
  () => import("./_charts-content").then((m) => m.default),
  { ssr: false },
);
export default ChartsSection;

// Re-export type for consumers
export type { DashboardData };
