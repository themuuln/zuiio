"use client";

import dynamic from "next/dynamic";
import { ChartSkeleton } from "@/components/ui/chart-skeleton";

const ChartFallback = () => <ChartSkeleton />;

export const ExpenseDonutChart = dynamic(
  () => import("./expense-donut-chart").then((m) => m.ExpenseDonutChart),
  { ssr: false, loading: ChartFallback },
);

export const ProductMarginChart = dynamic(
  () => import("./product-margin-chart").then((m) => m.ProductMarginChart),
  { ssr: false, loading: ChartFallback },
);

export const ProductRevenueChart = dynamic(
  () => import("./product-revenue-chart").then((m) => m.ProductRevenueChart),
  { ssr: false, loading: ChartFallback },
);

export const FinancialSummaryChart = dynamic(
  () =>
    import("./financial-summary-chart").then((m) => m.FinancialSummaryChart),
  { ssr: false, loading: ChartFallback },
);

export const PendingSalesChart = dynamic(
  () => import("./pending-sales-chart").then((m) => m.PendingSalesChart),
  { ssr: false, loading: ChartFallback },
);

export const StockMovementChart = dynamic(
  () => import("./stock-movement-chart").then((m) => m.StockMovementChart),
  { ssr: false, loading: ChartFallback },
);
