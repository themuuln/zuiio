"use client";

import { Medal, Share2, Trophy } from "lucide-react";
import Link from "next/link";
import { PlayerAvatar } from "@/components/player-avatar";
import { TeamLogo } from "@/components/team-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/* ── Types (mirrors server props) ── */

export interface PlayerOfTheWeek {
  player_id: string;
  player_name: string;
  player_name_latin: string | null;
  player_photo_url: string | null;
  team_name: string;
  team_short_code: string;
  team_primary_color: string | null;
  team_logo_url: string | null;
  team_slug: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  gp: number;
  score: number;
}

export interface MvpCandidate {
  player_id: string;
  player_name: string;
  player_name_latin: string | null;
  player_photo_url: string | null;
  team_name: string;
  team_short_code: string;
  team_primary_color: string | null;
  team_logo_url: string | null;
  team_slug: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  gp: number;
  cumulativeScore: number;
}

interface AwardCardsProps {
  potw: PlayerOfTheWeek | null;
  mvpTop5: MvpCandidate[];
}

/* ── Medals ── */

const _MEDALS = ["🥇", "🥈", "🥉"] as const;

/* ── Stat pill ── */

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="font-display text-2xl leading-none tabular-nums sm:text-3xl">
        {value.toFixed(1)}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
        {label}
      </span>
    </div>
  );
}

/* ── Player of the Week Card ── */

function PlayerOfTheWeekCard({ player }: { player: PlayerOfTheWeek }) {
  const borderColor = player.team_primary_color ?? "var(--brand-sports)";

  return (
    <Card
      data-award="potw"
      className="relative overflow-hidden"
      style={{ borderColor }}
    >
      {/* Gradient backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          background: `linear-gradient(135deg, ${borderColor} 0%, transparent 60%)`,
        }}
        aria-hidden="true"
      />

      <CardHeader className="relative">
        <div className="flex items-center gap-2">
          <Trophy
            className="size-5 text-[var(--brand-sports)]"
            aria-hidden="true"
          />
          <CardTitle className="font-display text-xl tracking-tight sm:text-2xl">
            ИЛДЭР ТОГЛОГЧ
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">Долооны шилдэг тоглогч</p>
      </CardHeader>

      <CardContent className="relative">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          {/* Photo + team */}
          <div className="flex flex-col items-center gap-3">
            <PlayerAvatar
              photoUrl={player.player_photo_url}
              name={player.player_name}
              primaryColor={player.team_primary_color}
              size="2xl"
            />
            <Link
              href={`/players/${player.player_id}`}
              className="text-center transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
            >
              <span className="font-display text-2xl leading-tight tracking-tight sm:text-3xl">
                {player.player_name}
              </span>
              {player.player_name_latin && (
                <span className="block text-sm text-muted-foreground">
                  {player.player_name_latin}
                </span>
              )}
            </Link>
            <Link
              href={`/teams/${player.team_slug}`}
              className="flex items-center gap-2 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
            >
              <TeamLogo
                logoUrl={player.team_logo_url}
                shortCode={player.team_short_code}
                primaryColor={player.team_primary_color}
                size="sm"
              />
              <span className="text-sm font-medium">{player.team_name}</span>
            </Link>
          </div>

          {/* Stat line */}
          <div className="flex flex-1 items-center justify-center gap-3 sm:justify-end">
            <StatPill label="Оноо" value={player.pts} />
            <div className="w-px self-stretch opacity-20" aria-hidden="true" />
            <StatPill label="Давсан" value={player.reb} />
            <div className="w-px self-stretch opacity-20" aria-hidden="true" />
            <StatPill label="Олгосон" value={player.ast} />
            <div className="w-px self-stretch opacity-20" aria-hidden="true" />
            <StatPill label="Булаасан" value={player.stl} />
            <div className="w-px self-stretch opacity-20" aria-hidden="true" />
            <StatPill label="Хаасан" value={player.blk} />
          </div>
        </div>

        {/* Bottom meta */}
        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <Badge variant="secondary">{player.gp} тоглолт</Badge>
          <ShareButton playerId={player.player_id} />
        </div>
      </CardContent>
    </Card>
  );
}

/* ── MVP Row (for 4th / 5th) ── */

function MvpRow({
  candidate,
  rank,
}: {
  candidate: MvpCandidate;
  rank: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold">
        {rank}
      </span>
      <PlayerAvatar
        photoUrl={candidate.player_photo_url}
        name={candidate.player_name}
        primaryColor={candidate.team_primary_color}
        size="md"
      />
      <div className="min-w-0 flex-1">
        <Link
          href={`/players/${candidate.player_id}`}
          className="block truncate text-sm font-semibold transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
        >
          {candidate.player_name}
        </Link>
        <span className="text-xs text-muted-foreground">
          {candidate.team_name}
        </span>
      </div>
      <div className="shrink-0 text-right">
        <span className="font-display text-lg tabular-nums">
          {candidate.cumulativeScore.toFixed(0)}
        </span>
        <span className="block text-[10px] uppercase text-muted-foreground">
          оноо
        </span>
      </div>
    </div>
  );
}

/* ── MVP Podium (top 3 elevated) ── */

function MvpPodium({ candidates }: { candidates: MvpCandidate[] }) {
  const top3 = candidates.slice(0, 3);

  return (
    <div className="flex items-end justify-center gap-3 sm:gap-4">
      {/* 2nd */}
      {top3[1] && (
        <div className="flex flex-1 flex-col items-center gap-2">
          <span className="text-2xl">🥈</span>
          <PlayerAvatar
            photoUrl={top3[1].player_photo_url}
            name={top3[1].player_name}
            primaryColor={top3[1].team_primary_color}
            size="xl"
          />
          <Link
            href={`/players/${top3[1].player_id}`}
            className="text-center text-sm font-semibold leading-tight transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
          >
            {top3[1].player_name}
          </Link>
          <span className="text-xs text-muted-foreground">
            {top3[1].team_name}
          </span>
          <div className="mt-auto flex h-14 w-full items-center justify-center rounded-t-lg bg-muted font-display text-xl tabular-nums">
            {top3[1].cumulativeScore.toFixed(0)}
          </div>
        </div>
      )}

      {/* 1st — elevated */}
      {top3[0] && (
        <div className="flex flex-1 flex-col items-center gap-2">
          <span className="text-3xl">🥇</span>
          <PlayerAvatar
            photoUrl={top3[0].player_photo_url}
            name={top3[0].player_name}
            primaryColor={top3[0].team_primary_color}
            size="xl"
            className="ring-2 ring-[var(--brand-sports)]"
          />
          <Link
            href={`/players/${top3[0].player_id}`}
            className="text-center text-sm font-semibold leading-tight transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
          >
            {top3[0].player_name}
          </Link>
          <span className="text-xs text-muted-foreground">
            {top3[0].team_name}
          </span>
          <div className="mt-auto flex h-20 w-full items-center justify-center rounded-t-lg bg-[var(--brand-sports)]/15 font-display text-2xl tabular-nums text-[var(--brand-sports-dim)]">
            {top3[0].cumulativeScore.toFixed(0)}
          </div>
        </div>
      )}

      {/* 3rd */}
      {top3[2] && (
        <div className="flex flex-1 flex-col items-center gap-2">
          <span className="text-2xl">🥉</span>
          <PlayerAvatar
            photoUrl={top3[2].player_photo_url}
            name={top3[2].player_name}
            primaryColor={top3[2].team_primary_color}
            size="xl"
          />
          <Link
            href={`/players/${top3[2].player_id}`}
            className="text-center text-sm font-semibold leading-tight transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
          >
            {top3[2].player_name}
          </Link>
          <span className="text-xs text-muted-foreground">
            {top3[2].team_name}
          </span>
          <div className="mt-auto flex h-10 w-full items-center justify-center rounded-t-lg bg-muted font-display text-lg tabular-nums">
            {top3[2].cumulativeScore.toFixed(0)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── MVP Race Section ── */

function MvpRaceSection({ candidates }: { candidates: MvpCandidate[] }) {
  if (candidates.length === 0) return null;

  return (
    <Card data-award="mvp">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Medal
            className="size-5 text-[var(--brand-sports)]"
            aria-hidden="true"
          />
          <CardTitle className="font-display text-xl tracking-tight sm:text-2xl">
            MVP УРАЛДААН
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">
          Улирлын нийлбэр гүйцэтгэлийн тэргүүлэгчид
        </p>
      </CardHeader>

      <CardContent>
        {/* Podium: top 3 */}
        {candidates.length >= 1 && (
          <div className="mb-6">
            <MvpPodium candidates={candidates} />
          </div>
        )}

        {/* Rows: 4th, 5th */}
        <div className="flex flex-col gap-2">
          {candidates.slice(3).map((c, i) => (
            <MvpRow key={c.player_id} candidate={c} rank={i + 4} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Share Button ── */

function ShareButton({ playerId }: { playerId: string }) {
  function handleShare() {
    const card = document.querySelector(`[data-award="potw"]`);
    if (card) {
      card.setAttribute("data-award-capture", playerId);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      aria-label="Нийтлэх зураг бэлтгэх"
    >
      <Share2 className="size-3.5" aria-hidden="true" />
      Нийтлэх
    </Button>
  );
}

/* ── Main Export ── */

export function AwardCards({ potw, mvpTop5 }: AwardCardsProps) {
  if (!potw && mvpTop5.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-16 text-center">
        <Trophy
          className="size-12 text-muted-foreground/40"
          aria-hidden="true"
        />
        <p className="text-lg font-medium text-muted-foreground">
          Мэдээлэл байхгүй байна
        </p>
        <p className="text-sm text-muted-foreground">
          Тоглолтын дүн нэмсний дараа наградууд харагдана.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {potw && <PlayerOfTheWeekCard player={potw} />}

      {mvpTop5.length > 0 && <MvpRaceSection candidates={mvpTop5} />}
    </div>
  );
}
