"use client";

import { Package } from "@phosphor-icons/react/dist/ssr";
import {
  Bar,
  BarChart,
  CartesianGrid,
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
import { formatCurrency } from "@/lib/format";
import type { ProductSalesRow } from "@/lib/reports";

export function ProductRevenueChart({ data }: { data: ProductSalesRow[] }) {
  if (data.length === 0) {
    return (
      <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>Бүтээгдэхүүний орлого, өртөг, ашиг</CardTitle>
          <CardDescription>
            Бүтээгдэхүүн тус бүрийн орлого, өртөг, ашгийн харьцуулалт
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ErpEmptyState
            icon={<Package className="size-4" />}
            title="Борлуулалтын мэдээлэл алга"
            description="Сонгосон хугацаанд борлуулалт хийгдээгүй байна."
          />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((row) => ({
    name: row.productName,
    revenue: row.revenue,
    cost: row.cost,
    profit: row.profit,
  }));

  return (
    <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle>Бүтээгдэхүүний орлого, өртөг, ашиг</CardTitle>
        <CardDescription>
          Бүтээгдэхүүн тус бүрийн орлого, өртөг, ашгийн харьцуулалт
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height={288} minHeight={288}>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 20, bottom: 0, left: 20 }}
              barGap={2}
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
              <Bar
                dataKey="revenue"
                name="Орлого"
                fill="oklch(0.6 0.16 225)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="cost"
                name="Өртөг"
                fill="oklch(0.63 0.14 25)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="profit"
                name="Ашиг"
                fill="oklch(0.67 0.14 175)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
