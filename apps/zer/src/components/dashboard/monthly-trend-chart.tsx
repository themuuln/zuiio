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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";

interface MonthlyTrendItem {
  date: string;
  total: number;
}

export function MonthlyTrendChart({ data }: { data: MonthlyTrendItem[] }) {
  const hasSalesData = data.some((d) => d.total > 0);

  return (
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
            <ResponsiveContainer
              width="100%"
              height="100%"
              minHeight={240}
              initialDimension={{ width: 640, height: 240 }}
            >
              <BarChart data={data}>
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
  );
}
