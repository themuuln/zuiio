"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Player {
  id: string;
  canonical_name: string;
  name_latin: string | null;
  jersey_number: number | null;
}

interface PlayerStats {
  playerId: string;
  gp: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  perGame: {
    pts: string;
    reb: string;
    ast: string;
    stl: string;
    blk: string;
  };
  efficiency: {
    efg: string;
    ts: string;
    astTo: string;
  };
}

export default function ComparePlayersPage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const { data: searchResults } = useQuery({
    queryKey: ["playerSearch", search],
    queryFn: async () => {
      if (!search || search.length < 2) return [];
      const res = await fetch(
        `/api/stats/compare-players?playerIds=${selectedIds.join(",") || "placeholder"}`
      );
      // Simple search - in production, add a search endpoint
      return [];
    },
    enabled: search.length >= 2,
  });

  const { data: comparison, isLoading } = useQuery({
    queryKey: ["playerComparison", selectedIds],
    queryFn: async () => {
      if (selectedIds.length < 2) return null;
      const res = await fetch(
        `/api/stats/compare-players?playerIds=${selectedIds.join(",")}`
      );
      return res.json();
    },
    enabled: selectedIds.length >= 2,
  });

  const addPlayer = (id: string) => {
    if (selectedIds.length < 5 && !selectedIds.includes(id)) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const removePlayer = (id: string) => {
    setSelectedIds(selectedIds.filter((i) => i !== id));
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Тоглогчдыг харьцуулах</h1>

      {/* Player Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Тоглогч сонгох (2-5)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Тоглогчийн нэр хайх..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedIds.map((id) => (
              <div
                key={id}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1 rounded-full"
              >
                <span className="text-sm">Тоглогч {id.slice(0, 8)}</span>
                <button
                  onClick={() => removePlayer(id)}
                  className="text-xs hover:opacity-70"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      {comparison && comparison.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Харьцуулалт</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Тоглогч</th>
                    <th className="text-right p-2">Тоглолт</th>
                    <th className="text-right p-2">Оноо</th>
                    <th className="text-right p-2">Сандал</th>
                    <th className="text-right p-2">Олголт</th>
                    <th className="text-right p-2">Булаалт</th>
                    <th className="text-right p-2">Хүндэтгэл</th>
                    <th className="text-right p-2">eFG%</th>
                    <th className="text-right p-2">TS%</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((player: { id: string; canonical_name?: string; stats: PlayerStats }) => (
                    <tr key={player.id} className="border-b">
                      <td className="p-2 font-medium">
                        {player.canonical_name || "Тодорхойгүй"}
                      </td>
                      <td className="text-right p-2">{player.stats.gp}</td>
                      <td className="text-right p-2 font-bold">
                        {player.stats.perGame.pts}
                      </td>
                      <td className="text-right p-2">
                        {player.stats.perGame.reb}
                      </td>
                      <td className="text-right p-2">
                        {player.stats.perGame.ast}
                      </td>
                      <td className="text-right p-2">
                        {player.stats.perGame.stl}
                      </td>
                      <td className="text-right p-2">{player.stats.tov || 0}</td>
                      <td className="text-right p-2">
                        {player.stats.efficiency.efg}
                      </td>
                      <td className="text-right p-2">
                        {player.stats.efficiency.ts}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedIds.length < 2 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Харьцуулахын тулд хамгийн багадаа 2 тоглогч сонгоно уу
          </CardContent>
        </Card>
      )}
    </main>
  );
}
