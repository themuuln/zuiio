"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type LeaderRow = {
  player_id: string;
  player_name: string;
  player_latin: string | null;
  team_name: string;
  team_short: string;
  team_color: string | null;
  pts: number | null;
  dreb: number | null;
  oreb: number | null;
  ast: number | null;
  stl: number | null;
  blk: number | null;
};

interface CategoryConfig {
  key: string;
  label: string;
  statKey: keyof Pick<LeaderRow, "pts" | "dreb" | "ast" | "stl" | "blk">;
  suffix?: string;
}

const CATEGORIES: CategoryConfig[] = [
  { key: "pts", label: "Оноо", statKey: "pts" },
  { key: "reb", label: "Давсан", statKey: "dreb" },
  { key: "ast", label: "Олгосон", statKey: "ast" },
  { key: "stl", label: "Булаасан", statKey: "stl" },
  { key: "blk", label: "Хаасан", statKey: "blk" },
];

function sortLeaders(leaders: LeaderRow[], statKey: string): LeaderRow[] {
  return [...leaders]
    .sort((a, b) => {
      const aVal = (a[statKey as keyof LeaderRow] as number) ?? 0;
      const bVal = (b[statKey as keyof LeaderRow] as number) ?? 0;
      return bVal - aVal;
    })
    .slice(0, 10);
}

function formatStat(val: number | null, suffix?: string): string {
  if (val == null) return "—";
  return suffix ? `${val.toFixed(1)}${suffix}` : val.toFixed(1);
}

export function LeaderTabs({ leaders }: { leaders: LeaderRow[] }) {
  return (
    <Tabs defaultValue="pts" className="space-y-4">
      <TabsList>
        {CATEGORIES.map((cat) => (
          <TabsTrigger key={cat.key} value={cat.key}>
            {cat.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {CATEGORIES.map((cat) => {
        const sorted = sortLeaders(leaders, cat.statKey);
        return (
          <TabsContent key={cat.key} value={cat.key}>
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm" role="table">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium w-12" scope="col">
                        #
                      </th>
                      <th className="px-4 py-3 font-medium" scope="col">
                        Тоглогч
                      </th>
                      <th className="px-4 py-3 font-medium" scope="col">
                        Баг
                      </th>
                      <th
                        className="px-4 py-3 font-medium text-right"
                        scope="col"
                      >
                        {cat.label}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((row, i) => (
                      <tr
                        key={row.player_id}
                        className="border-b last:border-0 transition-colors hover:bg-accent/30"
                      >
                        <td className="px-4 py-3 text-muted-foreground tabular-nums">
                          {i + 1}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          <Link
                            href={`/players/${row.player_id}`}
                            className="hover:underline"
                          >
                            {row.player_name}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="inline-block size-3 rounded-full border"
                              style={{
                                backgroundColor:
                                  row.team_color ?? "oklch(0.5 0 0)",
                              }}
                              aria-hidden="true"
                            />
                            <Link
                              href={`/teams/${row.team_short === "ХАС" ? "team-a" : "team-b"}`}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {row.team_name}
                            </Link>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-semibold">
                          {formatStat(row[cat.statKey])}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
