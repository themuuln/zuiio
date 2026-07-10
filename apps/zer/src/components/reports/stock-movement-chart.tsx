"use client";

import { Warehouse } from "@phosphor-icons/react/dist/ssr";
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
import type { StockMovementsSummary } from "@/lib/reports";

const MOVEMENT_LABELS: Record<string, { label: string; color: string }> = {
  in: { label: "Орлого", color: "oklch(0.67 0.14 175)" },
  out: { label: "Зарлага", color: "oklch(0.63 0.14 25)" },
  adjustment: { label: "Тохируулга", color: "oklch(0.55 0.08 280)" },
};

export function StockMovementChart({ data }: { data: StockMovementsSummary }) {
  const total = data.in + data.out + data.adjustment;

  if (total === 0) {
    return (
      <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle>Барааны хөдөлгөөн</CardTitle>
          <CardDescription>
            Сонгосон хугацааны барааны орлого, зарлага, тохируулга
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ErpEmptyState
            icon={<Warehouse className="size-4" />}
            title="Хөдөлгөөний мэдээлэл алга"
            description="Сонгосон хугацаанд барааны хөдөлгөөн бүртгэгдээгүй байна."
          />
        </CardContent>
      </Card>
    );
  }

  const chartData = [
    {
      name: MOVEMENT_LABELS.in.label,
      value: data.in,
      fill: MOVEMENT_LABELS.in.color,
    },
    {
      name: MOVEMENT_LABELS.out.label,
      value: data.out,
      fill: MOVEMENT_LABELS.out.color,
    },
    {
      name: MOVEMENT_LABELS.adjustment.label,
      value: data.adjustment,
      fill: MOVEMENT_LABELS.adjustment.color,
    },
  ];

  return (
    <Card className="rounded-3xl border-border/80 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle>Барааны хөдөлгөөн</CardTitle>
        <CardDescription>
          Сонгосон хугацааны барааны орлого, зарлага, тохируулга
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height={224} minHeight={224}>
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
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "var(--radius)",
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--background))",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                formatter={(value) => {
                  if (typeof value !== "number") return [String(value), "Тоо"];
                  return [`${value} удаа`, "Тоо"];
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
