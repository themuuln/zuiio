"use client";

import { ChartLineUp } from "@phosphor-icons/react/dist/ssr";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ErpEmptyState } from "@/components/erp/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ProductSalesRow } from "@/lib/reports";

export function ProductMarginChart({ data }: { data: ProductSalesRow[] }) {
  if (data.length === 0) {
    return (
      <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>Бүтээгдэхүүний ашгийн хувь</CardTitle>
          <CardDescription>
            Бүтээгдэхүүн тус бүрийн ашгийн хувь, дундаж
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ErpEmptyState
            icon={<ChartLineUp className="size-4" />}
            title="Ашгийн мэдээлэл алга"
            description="Сонгосон хугацаанд борлуулалт хийгдээгүй байна."
          />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((row) => ({
    name: row.productName,
    margin: row.margin,
    profit: row.profit,
  }));

  const avgMargin =
    data.reduce((sum, row) => sum + row.margin, 0) / data.length;

  return (
    <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle>Бүтээгдэхүүний ашгийн хувь</CardTitle>
        <CardDescription>
          Бүтээгдэхүүн тус бүрийн ашгийн хувь, дундаж {avgMargin.toFixed(1)}%
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
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val.toFixed(0)}%`}
                domain={[0, "auto"]}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "var(--radius)",
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--background))",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                formatter={(value) => {
                  if (typeof value !== "number") return [String(value), "Ашиг"];
                  return [`${value.toFixed(1)}%`, "Ашиг"];
                }}
              />
              <ReferenceLine
                y={avgMargin}
                stroke="oklch(0.67 0.14 175)"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: `Дундаж ${avgMargin.toFixed(1)}%`,
                  position: "right",
                  fill: "oklch(0.67 0.14 175)",
                  fontSize: 11,
                }}
              />
              <Bar
                dataKey="margin"
                radius={[8, 8, 0, 0]}
                maxBarSize={60}
                fill="oklch(0.72 0.15 95)"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
