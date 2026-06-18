"use client";

import {
  ChartLineUp,
  ClockCountdown,
  Coin,
  Package,
  Plus,
  ShoppingCart,
  Star,
  TrendDown,
  TrendUp,
  Users,
  Warehouse,
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

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

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

// ─── Sub-components ────────────────────────────────────────────────────

function PulseCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "emerald" | "red" | "blue" | "amber";
}) {
  const colorClasses: Record<string, string> = {
    emerald:
      "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/50",
    red: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50",
    blue: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50",
    amber:
      "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50",
  };
  const iconClasses: Record<string, string> = {
    emerald:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400",
    red: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400",
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400",
  };

  return (
    <Card size="sm" className={cn(colorClasses[color])}>
      <div className="flex items-center gap-3 px-4">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            iconClasses[color],
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <p className="text-base font-bold tabular-nums tracking-tight">
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
}

function ShortcutCard({
  href,
  icon,
  label,
  count,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  count: string;
}) {
  return (
    <Link href={href} className="group block">
      <Card
        size="sm"
        className="transition-colors hover:bg-accent/50 [&_svg]:transition-transform [&_svg]:group-hover:scale-110"
      >
        <div className="flex items-center gap-3 px-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{label}</p>
            <p className="text-lg font-bold tabular-nums tracking-tight">
              {count}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function HeroActionCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md">
        <CardContent className="flex h-full items-center gap-4 py-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary [&>svg]:transition-transform [&>svg]:group-hover:scale-110">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{title}</p>
            <p className="truncate text-sm text-muted-foreground">
              {description}
            </p>
          </div>
          <Plus
            weight="bold"
            className="size-5 shrink-0 text-muted-foreground/40 transition-all group-hover:text-primary group-hover:rotate-45"
          />
        </CardContent>
      </Card>
    </Link>
  );
}

// ─── Main Component ────────────────────────────────────────────────────

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

  const hasSalesData = data.monthlyTrend.some((d) => d.total > 0);

  const netProfit = data.todaySalesTotal - data.todayExpensesTotal;

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Page Header */}
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

      {/* ─── 1. Hero Quick Action Cards ─────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <HeroActionCard
          href="/sales?create=true"
          icon={<ShoppingCart className="size-6" />}
          title="Шинэ борлуулалт"
          description="Борлуулалт бүртгэх"
        />
        <HeroActionCard
          href="/expenses?create=true"
          icon={<Coin className="size-6" />}
          title="Шинэ зарлага"
          description="Зарлагын бүртгэл"
        />
        <HeroActionCard
          href="/products"
          icon={<Package className="size-6" />}
          title="Шинэ бүтээгдэхүүн"
          description="Бүтээгдэхүүн нэмэх"
        />
      </div>

      {/* ─── 2. Today's Pulse Strip ─────────────────────────────────── */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Өнөөдрийн байдал
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <PulseCard
            icon={<TrendUp className="size-5" />}
            label="Өнөөдрийн борлуулалт"
            value={formatCurrency(data.todaySalesTotal)}
            color="emerald"
          />
          <PulseCard
            icon={<TrendDown className="size-5" />}
            label="Өнөөдрийн зарлага"
            value={formatCurrency(data.todayExpensesTotal)}
            color="red"
          />
          <PulseCard
            icon={<ChartLineUp className="size-5" />}
            label="Цэвэр ашиг"
            value={formatCurrency(netProfit)}
            color="blue"
          />
          <PulseCard
            icon={<ClockCountdown className="size-5" />}
            label="Хүлээгдэж буй"
            value={data.pendingSalesCount.toLocaleString()}
            color="amber"
          />
        </div>
      </div>

      {/* ─── 3. Quick Shortcuts Grid ────────────────────────────────── */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Түргэн цэс
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <ShortcutCard
            href="/products"
            icon={<Package className="size-5" />}
            label="Бүтээгдэхүүн"
            count={data.totalProducts.toLocaleString()}
          />
          <ShortcutCard
            href="/customers"
            icon={<Users className="size-5" />}
            label="Харилцагчид"
            count={data.totalCustomers.toLocaleString()}
          />
          <ShortcutCard
            href="/suppliers"
            icon={<Star className="size-5" />}
            label="Нийлүүлэгчид"
            count={data.totalSuppliers.toLocaleString()}
          />
          <ShortcutCard
            href="/inventory"
            icon={<Warehouse className="size-5" />}
            label="Агуулах"
            count={formatCurrency(data.inventoryValue)}
          />
          <ShortcutCard
            href="/products"
            icon={<Warning className="size-5" />}
            label="Бага нөөц"
            count={data.lowStockCount.toLocaleString()}
          />
          <ShortcutCard
            href="/sales"
            icon={<ShoppingCart className="size-5" />}
            label="Хүлээгдэж буй"
            count={data.pendingSalesCount.toLocaleString()}
          />
        </div>
      </div>

      {/* ─── 4. Existing: Recent Sales Table ────────────────────────── */}
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

      {/* ─── 5. Existing: Monthly Trend Chart ───────────────────────── */}
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
    </div>
  );
}
