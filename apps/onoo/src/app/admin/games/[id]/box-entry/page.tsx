"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { gamesApi, playersApi } from "@/app/admin/_lib/api";
import { AdminCardSkeleton } from "@/components/admin/admin-skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

interface PlayerLine {
  player_id: string;
  player_name: string;
  jersey_number: number;
  pts: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
  seconds_played: number | null;
}

const STAT_FIELDS = [
  "pts",
  "fgm",
  "fga",
  "tpm",
  "tpa",
  "ftm",
  "fta",
  "oreb",
  "dreb",
  "ast",
  "stl",
  "blk",
  "tov",
  "pf",
] as const;

function emptyLine(player: {
  id: string;
  canonical_name: string;
  jersey_number?: number | null;
}): PlayerLine {
  return {
    player_id: player.id,
    player_name: player.canonical_name,
    jersey_number: player.jersey_number ?? 0,
    pts: 0,
    fgm: 0,
    fga: 0,
    tpm: 0,
    tpa: 0,
    ftm: 0,
    fta: 0,
    oreb: 0,
    dreb: 0,
    ast: 0,
    stl: 0,
    blk: 0,
    tov: 0,
    pf: 0,
    seconds_played: null,
  };
}

function StatInput({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <label htmlFor={label} className="text-xs text-muted-foreground">
        {label}
      </label>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-12 rounded border bg-background px-1 py-0.5 text-center text-sm"
      />
    </div>
  );
}

export default function BoxEntryPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const {
    data: game,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["admin", "game", params.id],
    queryFn: () => gamesApi.get(params.id),
  });

  const { data: allPlayers = [] } = useQuery({
    queryKey: ["admin", "players"],
    queryFn: () => playersApi.list(),
  });

  const homeName = game?.home_team_season?.teams?.name ?? "Home";
  const awayName = game?.away_team_season?.teams?.name ?? "Away";

  const homePlayers = allPlayers
    .filter(
      (p) =>
        !p.position || p.position.startsWith("F") || p.position.startsWith("C"),
    )
    .slice(0, 12);

  const awayPlayers = allPlayers
    .filter((p) => p.position?.startsWith("G"))
    .concat(
      allPlayers.filter(
        (p) =>
          !p.position ||
          (!p.position.startsWith("F") &&
            !p.position.startsWith("G") &&
            !p.position.startsWith("C")),
      ),
    )
    .slice(0, 12);

  const [homeLines, setHomeLines] = useState<PlayerLine[]>([]);
  const [awayLines, setAwayLines] = useState<PlayerLine[]>([]);
  const [saving, setSaving] = useState(false);

  // Initialize lines once players load
  if (homeLines.length === 0 && homePlayers.length > 0) {
    setHomeLines(homePlayers.map(emptyLine));
  }
  if (awayLines.length === 0 && awayPlayers.length > 0) {
    setAwayLines(awayPlayers.map(emptyLine));
  }

  function updateLine(
    team: "home" | "away",
    idx: number,
    field: keyof PlayerLine,
    value: number | null,
  ) {
    const lines = team === "home" ? [...homeLines] : [...awayLines];
    const line = lines[idx];
    if (!line) return;
    const updated = { ...line, [field]: value } as PlayerLine;
    lines[idx] = updated;
    if (team === "home") setHomeLines(lines);
    else setAwayLines(lines);
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      // TODO(spec): Call Edge Function manual-box-entry
      // For now, show success
      toast.success("Box score saved (mock — Edge Function not deployed yet)");
      router.refresh();
    } catch {
      toast.error("Failed to save box score");
    } finally {
      setSaving(false);
    }
  }

  function renderTeamTable(
    label: string,
    lines: PlayerLine[],
    team: "home" | "away",
  ) {
    const totals = STAT_FIELDS.reduce(
      (acc, f) => {
        acc[f] = lines.reduce((sum, l) => sum + (l[f] as number), 0);
        return acc;
      },
      {} as Record<string, number>,
    );

    return (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{label}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-2 py-1 text-left">#</th>
                <th className="px-2 py-1 text-left">Player</th>
                {STAT_FIELDS.map((f) => (
                  <th key={f} className="px-1 py-1 text-center">
                    {f.toUpperCase()}
                  </th>
                ))}
                <th className="px-1 py-1 text-center">MIN</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => (
                <tr key={line.player_id} className="border-b">
                  <td className="px-2 py-1">{line.jersey_number}</td>
                  <td className="px-2 py-1 font-medium">{line.player_name}</td>
                  {STAT_FIELDS.map((f) => (
                    <td key={f} className="px-1 py-1">
                      <StatInput
                        value={line[f] as number}
                        onChange={(v) => updateLine(team, idx, f, v)}
                        label=""
                      />
                    </td>
                  ))}
                  <td className="px-1 py-1">
                    <input
                      type="number"
                      min={0}
                      value={line.seconds_played ?? ""}
                      onChange={(e) =>
                        updateLine(
                          team,
                          idx,
                          "seconds_played",
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                      placeholder="—"
                      className="w-14 rounded border bg-background px-1 py-0.5 text-center text-sm"
                    />
                  </td>
                </tr>
              ))}
              <tr className="font-bold border-t-2">
                <td className="px-2 py-1" colSpan={2}>
                  Total
                </td>
                {STAT_FIELDS.map((f) => (
                  <td key={f} className="px-1 py-1 text-center">
                    {totals[f]}
                  </td>
                ))}
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="space-y-6">
        <AdminCardSkeleton />
      </div>
    );
  }

  if (isError || !game) {
    return (
      <div className="space-y-6">
        <Empty>
          <EmptyMedia variant="icon" />
          <EmptyHeader>
            <EmptyTitle>Тоглолт олдсонгүй</EmptyTitle>
            <EmptyDescription>
              Энэ тоглолтын мэдээлэл байхгүй байна.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderTeamTable(homeName, homeLines, "home")}
      {renderTeamTable(awayName, awayLines, "away")}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={saving}
        className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {saving ? "Түр хүлээнэ үү..." : "Хадгалах"}
      </button>
    </div>
  );
}
