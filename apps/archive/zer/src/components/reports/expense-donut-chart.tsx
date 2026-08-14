"use client";

import { CreditCard } from "@phosphor-icons/react/dist/ssr";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { ErpEmptyState } from "@/components/erp/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { ExpenseCategoryRow } from "@/lib/reports";

const COLORS = [
  "oklch(0.6 0.16 225)",
  "oklch(0.67 0.14 175)",
  "oklch(0.72 0.15 95)",
  "oklch(0.63 0.14 25)",
  "oklch(0.55 0.08 280)",
  "oklch(0.65 0.12 190)",
  "oklch(0.6 0.15 350)",
];

export function ExpenseDonutChart({ data }: { data: ExpenseCategoryRow[] }) {
  if (data.length === 0) {
    return (
      <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>Зарлагын бүтэц</CardTitle>
          <CardDescription>
            Зарлагын ангилал тус бүрийн эзлэх хувь
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ErpEmptyState
            icon={<CreditCard className="size-4" />}
            title="Зарлагын мэдээлэл алга"
            description="Сонгосон хугацаанд зарлага бүртгэгдээгүй байна."
          />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((row, i) => ({
    name: row.category,
    value: row.total,
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle>Зарлагын бүтэц</CardTitle>
        <CardDescription>
          Зарлагын ангилал тус бүрийн эзлэх хувь
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <PieChart width={320} height={320}>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={130}
              paddingAngle={2}
              label={({ name, percent }: { name?: string; percent?: number }) =>
                `${name ?? ""} ${(percent ?? 0) * 100 > 0 ? `${((percent ?? 0) * 100).toFixed(0)}%` : ""}`
              }
              labelLine
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
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
          </PieChart>
        </div>
      </CardContent>
    </Card>
  );
}
