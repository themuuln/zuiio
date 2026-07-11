"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

type PlayerRow = {
  player_id: string;
  player_name: string;
  player_latin: string | null;
  team_name: string;
  team_short: string;
  team_color: string | null;
  gp: number | null;
  pts: number | null;
  dreb: number | null;
  oreb: number | null;
  ast: number | null;
  stl: number | null;
  blk: number | null;
  tov: number | null;
  pf: number | null;
  fgm: number | null;
  fga: number | null;
  tpm: number | null;
  tpa: number | null;
};

type SortKey =
  | "player_name"
  | "team_name"
  | "gp"
  | "pts"
  | "dreb"
  | "ast"
  | "stl"
  | "blk";

const TEAM_SLUG_MAP: Record<string, string> = {
  ХАС: "team-a",
  ТЭЗ: "team-b",
};

const COLUMNS: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "player_name", label: "Тоглогч" },
  { key: "team_name", label: "Баг" },
  { key: "gp", label: "Тоглолт", align: "right" },
  { key: "pts", label: "Оноо", align: "right" },
  { key: "dreb", label: "Давсан", align: "right" },
  { key: "ast", label: "Олгосон", align: "right" },
  { key: "stl", label: "Булаасан", align: "right" },
  { key: "blk", label: "Хаасан", align: "right" },
];

function formatStat(val: number | null, decimals = 1): string {
  if (val == null) return "—";
  return val.toFixed(decimals);
}

export function PlayerGrid({ players }: { players: PlayerRow[] }) {
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("pts");
  const [sortAsc, setSortAsc] = useState(false);

  const teams = Array.from(
    new Map(players.map((p) => [p.team_short, p.team_name])).entries(),
  ).sort((a, b) => a[1].localeCompare(b[1]));

  const filtered = players
    .filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        p.player_name.toLowerCase().includes(q) ||
        (p.player_latin?.toLowerCase().includes(q) ?? false);
      const matchesTeam = teamFilter === "all" || p.team_short === teamFilter;
      return matchesSearch && matchesTeam;
    })
    .sort((a, b) => {
      const aVal = (a[sortKey] as number | null) ?? 0;
      const bVal = (b[sortKey] as number | null) ?? 0;
      if (sortKey === "player_name" || sortKey === "team_name") {
        const cmp = String(a[sortKey]).localeCompare(String(b[sortKey]));
        return sortAsc ? cmp : -cmp;
      }
      return sortAsc ? aVal - bVal : bVal - aVal;
    });

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Тоглогч хайх..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          aria-label="Тоглогч хайх"
        />
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          aria-label="Баг сонгох"
        >
          <option value="all">Бүх багууд</option>
          {teams.map(([short, name]) => (
            <option key={short} value={short}>
              {name}
            </option>
          ))}
        </select>
        <span className="text-sm text-muted-foreground tabular-nums">
          {filtered.length} тоглогч
        </span>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium w-12" scope="col">
                  #
                </th>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-3 font-medium ${col.align === "right" ? "text-right" : ""}`}
                    scope="col"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      {col.label}
                      <span className="text-xs" aria-hidden="true">
                        {sortKey === col.key
                          ? sortAsc
                            ? " ↑"
                            : " ↓"
                          : null}
                      </span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={COLUMNS.length + 1}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Тоглогч олдсонгүй
                  </td>
                </tr>
              ) : (
                filtered.map((row, i) => (
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
                      {row.player_latin && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {row.player_latin}
                        </span>
                      )}
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
                          href={`/teams/${TEAM_SLUG_MAP[row.team_short] ?? "team-a"}`}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {row.team_name}
                        </Link>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatStat(row.gp, 0)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">
                      {formatStat(row.pts)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatStat(row.dreb)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatStat(row.ast)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatStat(row.stl)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatStat(row.blk)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
