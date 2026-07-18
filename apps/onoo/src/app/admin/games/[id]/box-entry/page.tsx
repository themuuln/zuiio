"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

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

interface BoxEntryFormProps {
  gameId: string;
  homeTeamSeasonId: string;
  awayTeamSeasonId: string;
  homePlayers: {
    id: string;
    canonical_name: string;
    jersey_number: number | null;
  }[];
  awayPlayers: {
    id: string;
    canonical_name: string;
    jersey_number: number | null;
  }[];
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
  jersey_number: number | null;
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

export default function BoxEntryForm({
  gameId: _gameId,
  homeTeamSeasonId: _homeTeamSeasonId,
  awayTeamSeasonId: _awayTeamSeasonId,
  homePlayers,
  awayPlayers,
}: BoxEntryFormProps) {
  const router = useRouter();
  const [homeLines, setHomeLines] = useState<PlayerLine[]>(
    homePlayers.map(emptyLine),
  );
  const [awayLines, setAwayLines] = useState<PlayerLine[]>(
    awayPlayers.map(emptyLine),
  );
  const [saving, setSaving] = useState(false);

  function updateLine(
    team: "home" | "away",
    idx: number,
    field: keyof PlayerLine,
    value: number | null,
  ) {
    const lines = team === "home" ? [...homeLines] : [...awayLines];
    const line = lines[idx];
    if (!line) return;
    // Safe: field is keyof PlayerLine, value matches the expected type
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

  return (
    <div className="space-y-6">
      {renderTeamTable("Home", homeLines, "home")}
      {renderTeamTable("Away", awayLines, "away")}
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
