import { getStatLabel } from "@onoo/core";
import { Target } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ShotZoneStat } from "../../../lib/shared";
import type { ShotZone } from "./court-heatmap";
import { CourtHeatmap, DEFAULT_SHOT_ZONES } from "./court-heatmap";

interface ShootingProfile {
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
}

interface ShotChartProps {
  /** Aggregated made/attempted per zone (from v_public_shot_zones). */
  shotZones: ShotZoneStat[];
  /** Season shooting splits (from getPlayerShootingProfile). */
  shootingProfile: ShootingProfile;
  locale: "mn" | "en";
  className?: string;
}

const safe = (n: number | null | undefined): number =>
  typeof n === "number" && Number.isFinite(n) ? n : 0;

const pct = (made: number, attempted: number): number | null =>
  attempted > 0 ? (made / attempted) * 100 : null;

/**
 * Shot Chart section.
 *
 * Renders the real half-court heatmap from zone aggregates when shot-location
 * data exists, and a shooting-efficiency breakdown derived from the season
 * shooting profile (always available). The heatmap is honest: when no
 * shot-location events are captured yet it shows the empty court with a note.
 */
export function ShotChart({
  shotZones,
  shootingProfile,
  locale,
  className,
}: ShotChartProps) {
  const isEn = locale === "en";

  const zonesById = new Map(shotZones.map((z) => [z.zone_key, z]));
  const hasZoneData = shotZones.length > 0;

  const zones: ShotZone[] = hasZoneData
    ? DEFAULT_SHOT_ZONES.map((zone) => {
        const stat = zonesById.get(zone.id);
        return stat
          ? { ...zone, made: stat.made, attempted: stat.attempted }
          : zone;
      })
    : DEFAULT_SHOT_ZONES;

  const { fgm, fga, tpm, tpa, ftm, fta } = shootingProfile;
  const fg = safe(fga);
  const twoa = Math.max(0, fg - safe(tpa));
  const twom = safe(fgm) - safe(tpm);

  const fgPct = pct(safe(fgm), fg);
  const twoPct = pct(twom, twoa);
  const threePct = pct(safe(tpm), safe(tpa));
  const ftPct = pct(safe(ftm), safe(fta));
  // Effective FG%: credits 3PT at 1.5× weight.
  const eFgPct = fg > 0 ? ((safe(fgm) + 0.5 * safe(tpm)) / fg) * 100 : null;
  // True Shooting %: points / (2 × (FGA + 0.44 × FTA)).
  const tsDenominator = 2 * (fg + 0.44 * safe(fta));
  const tsPct =
    tsDenominator > 0 ? ((safe(fgm) + safe(tpm)) / tsDenominator) * 100 : null;

  const metrics: { label: string; value: number | null }[] = [
    { label: isEn ? "FG%" : "Оролтын %", value: fgPct },
    { label: isEn ? "2PT%" : "2-онооны %", value: twoPct },
    { label: isEn ? "3PT%" : "3-онооны %", value: threePct },
    { label: isEn ? "FT%" : "Ширэнгийн %", value: ftPct },
    { label: "eFG%", value: eFgPct },
    { label: "TS%", value: tsPct },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--brand-sports)]/10 text-[var(--brand-sports)]">
            <Target className="size-5" aria-hidden="true" />
          </span>
          <div>
            <CardTitle className="text-lg">
              {isEn ? "Shot Chart" : "Шидэлтийн Зураглал"}
            </CardTitle>
            <CardDescription className="mt-1">
              {isEn
                ? "Shooting efficiency and court zones"
                : "Шидэлтийн үр ашиг болон талбайн бүс"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Court heatmap */}
          <div className="space-y-2">
            <CourtHeatmap zones={zones} />
            {!hasZoneData && (
              <p className="text-center text-xs text-muted-foreground">
                {isEn
                  ? "Shot-location tracking not yet available — court shows no zone data."
                  : "Шидэлтийн байршил бүртгэгдээгүй тул талбайн бүс хоосон харуулагдаж байна."}
              </p>
            )}
          </div>

          {/* Efficiency breakdown */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {metrics.map((m) => (
                <div
                  key={m.label}
                  className="rounded-lg border bg-muted/30 p-3 text-center"
                >
                  <p className="text-lg font-semibold tabular-nums text-foreground">
                    {m.value != null ? `${m.value.toFixed(1)}%` : "—"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {m.label}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>
                {getStatLabel("fgm", locale)} {safe(fgm)} /{" "}
                {getStatLabel("fga", locale)} {fg}
              </span>
              <span>
                {getStatLabel("tpm", locale)} {safe(tpm)} /{" "}
                {getStatLabel("tpa", locale)} {safe(tpa)}
              </span>
              <span>
                {getStatLabel("ftm", locale)} {safe(ftm)} /{" "}
                {getStatLabel("fta", locale)} {safe(fta)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
