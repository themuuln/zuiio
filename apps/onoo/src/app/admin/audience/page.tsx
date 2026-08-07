"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Eye, Gamepad2, TrendingUp, Users } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AudienceResponse } from "@/app/admin/api/audience/route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const _TYPENAME_BY_TYPE: Record<string, string> = {
  player: "Тоглогч",
  game: "Тоглолт",
};

export default function AudiencePage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const thirtyDaysAgo = format(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    "yyyy-MM-dd",
  );

  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);

  const queryKey = ["admin", "audience", startDate, endDate];

  const { data, isPending } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      });
      const res = await fetch(`/admin/api/audience?${params}`);
      if (!res.ok) throw new Error("Failed to fetch audience data");
      return res.json() as Promise<AudienceResponse>;
    },
  });

  const playerViews = useMemo(
    () =>
      data?.totalsByType.find((t) => t.entity_type === "player")?.total_views ??
      0,
    [data],
  );
  const gameViews = useMemo(
    () =>
      data?.totalsByType.find((t) => t.entity_type === "game")?.total_views ??
      0,
    [data],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Үзэгчдийн статистик
        </h1>
      </div>

      {/* Date range picker */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="start-date" className="text-sm text-muted-foreground">
            Эхлэх
          </label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="block rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="end-date" className="text-sm text-muted-foreground">
            Дуусах
          </label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="block rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-xs"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setStartDate(thirtyDaysAgo);
            setEndDate(today);
          }}
        >
          Сүүлийн 30 хоног
        </Button>
      </div>

      {isPending ? (
        <div className="text-center text-muted-foreground py-12">
          Ачааллаж байна...
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Нийт</CardTitle>
                <Eye className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.grandTotal.toLocaleString() ?? 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Тоглогчийн хуудас
                </CardTitle>
                <Users className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {playerViews.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Тоглолтын хуудас
                </CardTitle>
                <Gamepad2 className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {gameViews.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Өдрийн дундаж
                </CardTitle>
                <TrendingUp className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.dailyTotals.length
                    ? Math.round(
                        data.grandTotal / data.dailyTotals.length,
                      ).toLocaleString()
                    : 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily totals line chart */}
          <Card>
            <CardHeader>
              <CardTitle>Өдрийн хандалт</CardTitle>
            </CardHeader>
            <CardContent>
              {data && data.dailyTotals.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.dailyTotals}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-border"
                      />
                      <XAxis
                        dataKey="view_date"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v: unknown) => {
                          const d = new Date(`${String(v)}T00:00:00`);
                          return format(d, "MM/dd");
                        }}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        labelFormatter={(v: unknown) => {
                          const d = new Date(`${String(v)}T00:00:00`);
                          return format(d, "yyyy-MM-dd");
                        }}
                        formatter={(value: unknown) => [
                          (value ?? 0).toLocaleString(),
                          "Хандалт",
                        ]}
                      />
                      <Bar
                        dataKey="total_views"
                        fill="var(--color-primary)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Сонгосон хугацаанд өгөгдөл байхгүй
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top players and games */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Top 10 players */}
            <Card>
              <CardHeader>
                <CardTitle>Шилдэг 10 тоглогч</CardTitle>
              </CardHeader>
              <CardContent>
                {data && data.topPlayers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8">#</TableHead>
                        <TableHead>Тоглогч</TableHead>
                        <TableHead className="text-right">Хандалт</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.topPlayers.map((p, i) => (
                        <TableRow key={p.entity_id}>
                          <TableCell className="text-muted-foreground">
                            {i + 1}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {p.entity_id}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {p.view_count.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    Өгөгдөл байхгүй
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top 10 games */}
            <Card>
              <CardHeader>
                <CardTitle>Шилдэг 10 тоглолт</CardTitle>
              </CardHeader>
              <CardContent>
                {data && data.topGames.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8">#</TableHead>
                        <TableHead>Тоглолт</TableHead>
                        <TableHead className="text-right">Хандалт</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.topGames.map((g, i) => (
                        <TableRow key={g.entity_id}>
                          <TableCell className="text-muted-foreground">
                            {i + 1}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {g.entity_id}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {g.view_count.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    Өгөгдөл байгүй
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
