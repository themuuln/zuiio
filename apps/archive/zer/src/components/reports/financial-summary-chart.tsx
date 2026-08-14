"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { FinancialSummary } from "@/lib/reports";

export function FinancialSummaryChart({ data }: { data: FinancialSummary }) {
  const chartData = [
    {
      name: "Нийт борлуулалт",
      value: data.totalSales,
      fill: "oklch(0.6 0.16 225)",
    },
    {
      name: "Нийт зарлага",
      value: data.totalExpenses,
      fill: "oklch(0.63 0.14 25)",
    },
    {
      name: "Цэвэр мөнгөн урсгал",
      value: data.netCash,
      fill: data.netCash >= 0 ? "oklch(0.67 0.14 175)" : "oklch(0.55 0.18 25)",
    },
    {
      name: "Нийт ашиг",
      value: data.grossProfit,
      fill:
        data.grossProfit >= 0 ? "oklch(0.72 0.15 95)" : "oklch(0.55 0.18 25)",
    },
  ];

  return (
    <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle>Санхүүгийн үзүүлэлтүүд</CardTitle>
        <CardDescription>
          Үндсэн санхүүгийн үзүүлэлтүүдийн харьцуулалт
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height={288} minHeight={288}>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 20, bottom: 0, left: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border/50"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) =>
                  val >= 1000000
                    ? `${(val / 1000000).toFixed(1)}M`
                    : val >= 1000
                      ? `${(val / 1000).toFixed(0)}к`
                      : String(val)
                }
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "var(--radius)",
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--background))",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                formatter={(value) => {
                  if (typeof value !== "number") return [String(value), "Дүн"];
                  return [formatCurrency(value), "Дүн"];
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={80} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
