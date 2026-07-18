"use client";
import { Download } from "lucide-react";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  playerName: string;
  teamName: string;
  seasonLabel: string;
  stats: {
    pts: number | null;
    reb: number | null;
    ast: number | null;
    stl?: number | null;
    blk?: number | null;
    gp?: number | null;
  };
  teamColor?: string;
  locale?: "mn" | "en";
  className?: string;
}

const STAT_LABELS = {
  mn: {
    pts: "Оноо",
    reb: "Буулт",
    ast: "Олгосон",
    stl: "Булаасан",
    blk: "Блок",
    gp: "Тоглолт",
  },
  en: { pts: "PTS", reb: "REB", ast: "AST", stl: "STL", blk: "BLK", gp: "GP" },
} as const;

function formatStat(value: number | null): string {
  if (value == null) return "–";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opts: {
    playerName: string;
    teamName: string;
    seasonLabel: string;
    stats: StatCardProps["stats"];
    teamColor: string;
  },
) {
  const { playerName, teamName, seasonLabel, stats, teamColor } = opts;

  // Background
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, w, h);

  // Top accent bar
  const barGrad = ctx.createLinearGradient(0, 0, w, 0);
  barGrad.addColorStop(0, teamColor);
  barGrad.addColorStop(1, "#1a1a2e");
  ctx.fillStyle = barGrad;
  ctx.fillRect(0, 0, w, 6);

  // Player name
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 44px sans-serif";
  ctx.fillText(playerName, 48, 100);

  // Team + season
  ctx.fillStyle = "#999999";
  ctx.font = "22px sans-serif";
  ctx.fillText(`${teamName}  ·  ${seasonLabel}`, 48, 140);

  // Divider
  ctx.strokeStyle = "#222222";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(48, 170);
  ctx.lineTo(w - 48, 170);
  ctx.stroke();

  // Big stats row
  const primaryStats: Array<{ key: string; label: string; value: string }> = [
    { key: "pts", label: "PTS", value: formatStat(stats.pts) },
    { key: "reb", label: "REB", value: formatStat(stats.reb) },
    { key: "ast", label: "AST", value: formatStat(stats.ast) },
  ];

  const colWidth = (w - 96) / 3;
  primaryStats.forEach((s, i) => {
    const x = 48 + i * colWidth;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 72px sans-serif";
    ctx.fillText(s.value, x, 280);
    ctx.fillStyle = teamColor;
    ctx.font = "600 20px sans-serif";
    ctx.fillText(s.label, x, 310);
  });

  // Secondary stats row
  const secondaryStats: Array<{ key: string; label: string; value: string }> = [
    { key: "stl", label: "STL", value: formatStat(stats.stl ?? null) },
    { key: "blk", label: "BLK", value: formatStat(stats.blk ?? null) },
    { key: "gp", label: "GP", value: formatStat(stats.gp ?? null) },
  ];

  secondaryStats.forEach((s, i) => {
    const x = 48 + i * colWidth;
    ctx.fillStyle = "#cccccc";
    ctx.font = "bold 36px sans-serif";
    ctx.fillText(s.value, x, 390);
    ctx.fillStyle = "#666666";
    ctx.font = "500 16px sans-serif";
    ctx.fillText(s.label, x, 414);
  });

  // Bottom accent bar
  const btmGrad = ctx.createLinearGradient(0, h - 6, w, h - 6);
  btmGrad.addColorStop(0, "#1a1a2e");
  btmGrad.addColorStop(1, teamColor);
  ctx.fillStyle = btmGrad;
  ctx.fillRect(0, h - 6, w, 6);

  // Branding
  ctx.fillStyle = "#444444";
  ctx.font = "500 18px sans-serif";
  ctx.fillText("ONOO  ·  onoo.mn", 48, h - 28);
}

export function StatCard({
  playerName,
  teamName,
  seasonLabel,
  stats,
  teamColor = "#eab308",
  locale = "mn",
  className,
}: StatCardProps) {
  const labels = STAT_LABELS[locale];

  const handleDownload = useCallback(() => {
    const canvas = document.createElement("canvas");
    const dpr = 2;
    canvas.width = 1080 * dpr;
    canvas.height = 540 * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    drawCard(ctx, 1080, 540, {
      playerName,
      teamName,
      seasonLabel,
      stats,
      teamColor,
    });

    const link = document.createElement("a");
    link.download = `${playerName.replace(/\s+/g, "-").toLowerCase()}-stat-card.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [playerName, teamName, seasonLabel, stats, teamColor]);

  return (
    <Card
      data-stat-card
      className={cn(
        "overflow-hidden border-border/50 bg-[#0a0a0a] text-white",
        className,
      )}
    >
      <div
        className="h-1.5 w-full"
        style={{
          background: `linear-gradient(90deg, ${teamColor}, #1a1a2e)`,
        }}
        aria-hidden="true"
      />
      <CardHeader className="pb-2 pt-5">
        <CardTitle className="text-xl font-bold">{playerName}</CardTitle>
        <p className="text-sm text-neutral-400">
          {teamName} · {seasonLabel}
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pb-4">
        <div className="grid grid-cols-3 gap-4">
          {(["pts", "reb", "ast"] as const).map((key) => (
            <div key={key}>
              <span className="text-4xl font-bold tabular-nums">
                {formatStat(stats[key])}
              </span>
              <p
                className="mt-0.5 text-xs font-semibold uppercase tracking-wider"
                style={{ color: teamColor }}
              >
                {labels[key]}
              </p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {(["stl", "blk", "gp"] as const).map((key) => (
            <div key={key}>
              <span className="text-xl font-bold tabular-nums text-neutral-300">
                {formatStat(stats[key] ?? null)}
              </span>
              <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-neutral-500">
                {labels[key]}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
      <div
        className="h-1.5 w-full"
        style={{
          background: `linear-gradient(90deg, #1a1a2e, ${teamColor})`,
        }}
        aria-hidden="true"
      />
      <CardFooter className="justify-between py-3">
        <span className="text-xs font-medium text-neutral-600">
          ONOO · onoo.mn
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          aria-label={
            locale === "en" ? "Download stat card" : "Стат кардыг татаж авах"
          }
          className="gap-1.5 text-neutral-400 hover:text-white"
        >
          <Download className="size-4" aria-hidden="true" />
          {locale === "en" ? "Download" : "Татаж авах"}
        </Button>
      </CardFooter>
    </Card>
  );
}
