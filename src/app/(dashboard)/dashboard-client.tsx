"use client";

import {
  ArrowRight,
  CalendarBlank,
  ChartLineUp,
  Coin,
  Package,
  ShoppingCart,
  Star,
  Users,
  Warning,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { ErpEmptyState } from "@/components/erp/empty-state";
import { KpiGrid } from "@/components/erp/kpi-grid";
import { StatCard } from "@/components/erp/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";

// Module-level flag to prevent duplicate toasts on same-session navigation.
// Resets on full page reload (module re-evaluation).
let lowStockToastShownInSession = false;

export interface DashboardData {
  todaySalesTotal: number;
  todayExpensesTotal: number;
  totalProducts: number;
  totalCustomers: number;
  totalSuppliers: number;
  lowStockCount: number;
  pendingSalesCount: number;
  inventoryValue: number;
  recentSales: Array<{
    id: string;
    sale_date: string;
    contact_name: string | null;
    total_amount: number;
    status: string | null;
  }>;
  monthlyTrend: Array<{
    date: string;
    total: number;
  }>;
}

function statusBadgeVariant(
  status: string | null,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed":
      return "default";
    case "pending":
      return "secondary";
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
}

function statusLabel(status: string | null): string {
  switch (status) {
    case "completed":
      return "Дууссан";
    case "pending":
      return "Хүлээгдэж буй";
    case "cancelled":
      return "Цуцлагдсан";
    default:
      return status ?? "-";
  }
}

export function DashboardClient({ data }: { data: DashboardData }) {
  // Show low-stock toast notification on mount
  const hasShownToast = useRef(false);
  useEffect(() => {
    if (
      data.lowStockCount > 0 &&
      !hasShownToast.current &&
      !lowStockToastShownInSession
    ) {
      hasShownToast.current = true;
      lowStockToastShownInSession = true;
      toast.warning(`${data.lowStockCount} бүтээгдэхүүний нөөц бага байна`, {
        description:
          "Бүтээгдэхүүний нөөц хэт бага түвшинд хүрсэн тул нөхөх шаардлагатай.",
        duration: 5000,
      });
    }
  }, [data.lowStockCount]);

  const hasAnyData =
    data.todaySalesTotal > 0 ||
    data.todayExpensesTotal > 0 ||
    data.totalProducts > 0 ||
    data.totalCustomers > 0 ||
    data.totalSuppliers > 0;

  const hasSalesData = data.monthlyTrend.some((d) => d.total > 0);

  if (!hasAnyData) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Хяналтын самбар
          </h1>
          <p className="text-sm text-muted-foreground">
            Байгууллагын үндсэн үзүүлэлтүүд
          </p>
        </div>
        <ErpEmptyState
          icon={<ChartLineUp className="size-4" />}
          title="Мэдээлэл байхгүй"
          description="Хяналтын самбарт харуулах мэдээлэл одоогоор байхгүй байна. Бүтээгдэхүүн, борлуулалт, зарлага нэмэн үзүүлэлтүүдийг харна уу."
          action={
            <Button asChild size="sm">
              <Link href="/products">Бүтээгдэхүүн нэмэх</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Хяналтын самбар
          </h1>
          <p className="text-sm text-muted-foreground">
            Байгууллагын үндсэн үзүүлэлтүүд
          </p>
        </div>
      </div>

      {/* KPI Grid */}
      <KpiGrid>
        <StatCard
          icon={<Coin className="size-5" />}
          label="Өнөөдрийн борлуулалт"
          value={formatCurrency(data.todaySalesTotal)}
        />
        <StatCard
          icon={<CalendarBlank className="size-5" />}
          label="Өнөөдрийн зарлага"
          value={formatCurrency(data.todayExpensesTotal)}
        />
        <StatCard
          icon={<Package className="size-5" />}
          label="Нийт бүтээгдэхүүн"
          value={data.totalProducts.toLocaleString()}
        />
        <StatCard
          icon={<Users className="size-5" />}
          label="Нийт харилцагчид"
          value={data.totalCustomers.toLocaleString()}
        />
        <StatCard
          icon={<Star className="size-5" />}
          label="Нийт нийлүүлэгчид"
          value={data.totalSuppliers.toLocaleString()}
        />
        <StatCard
          icon={<Warning className="size-5" />}
          label="Бага нөөцтэй бүтээгдэхүүн"
          value={data.lowStockCount.toLocaleString()}
        />
        <StatCard
          icon={<ShoppingCart className="size-5" />}
          label="Хүлээгдэж буй борлуулалт"
          value={data.pendingSalesCount.toLocaleString()}
        />
        <StatCard
          icon={<Coin className="size-5" />}
          label="Агуулахын үнэ цэнэ"
          value={formatCurrency(data.inventoryValue)}
        />
      </KpiGrid>

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle>Сүүлийн борлуулалтууд</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.recentSales.length === 0 ? (
            <div className="px-6 pb-6 pt-2">
              <p className="text-sm text-muted-foreground">
                Борлуулалт бүртгэгдээгүй байна.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-6 py-3 font-medium">Огноо</th>
                    <th className="px-6 py-3 font-medium">Харилцагч</th>
                    <th className="px-6 py-3 font-medium text-right">Дүн</th>
                    <th className="px-6 py-3 font-medium">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentSales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="border-b last:border-0 hover:bg-muted/50"
                    >
                      <td className="px-6 py-3 text-muted-foreground">
                        {formatDate(sale.sale_date)}
                      </td>
                      <td className="px-6 py-3">{sale.contact_name ?? "-"}</td>
                      <td className="px-6 py-3 text-right font-medium">
                        {formatCurrency(sale.total_amount)}
                      </td>
                      <td className="px-6 py-3">
                        <Badge
                          variant={statusBadgeVariant(sale.status)}
                          className="capitalize"
                        >
                          {statusLabel(sale.status)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Сүүлийн 30 хоногийн борлуулалт</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasSalesData ? (
            <p className="text-sm text-muted-foreground">
              Сүүлийн 30 хоногт борлуулалт хийгдээгүй байна.
            </p>
          ) : (
            <div className="h-60 w-full md:h-72">
              <ResponsiveContainer width="100%" height="100%" minHeight={240}>
                <BarChart data={data.monthlyTrend}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border/50"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    tickFormatter={(val) => {
                      const d = new Date(val);
                      return `${d.getDate()}/${d.getMonth() + 1}`;
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    tickFormatter={(val) =>
                      val >= 1000000
                        ? `${(val / 1000000).toFixed(1)}M`
                        : val >= 1000
                          ? `${(val / 1000).toFixed(0)}к`
                          : String(val)
                    }
                  />
                  <Tooltip
                    formatter={(value) => {
                      if (typeof value === "number") {
                        return [formatCurrency(value), "Борлуулалт"];
                      }
                      return [String(value ?? ""), "Борлуулалт"];
                    }}
                    labelFormatter={(label) => formatDate(label)}
                  />
                  <Bar
                    dataKey="total"
                    fill="var(--color-primary, hsl(221.2 83.2% 53.3%))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/sales/new">
            Шинэ борлуулалт
            <ArrowRight className="ml-1 size-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/expenses/new">
            Шинэ зарлага
            <ArrowRight className="ml-1 size-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/products">
            Бүтээгдэхүүн
            <ArrowRight className="ml-1 size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
