import type { Metadata } from "next";
import type { LeaderRow } from "../lib/data";
import { getLeaders } from "../lib/data";
import { AwardCards } from "./components/award-card";


export const metadata: Metadata = {
  title: "Наградууд — Оноо",
  description:
    "Сагсан бөмбөгийн лигийн шилдэг тоглогчид: долооны шилдэг, MVP уралдаан.",
};

/**
 * Weighted composite score for award ranking.
 * PTS + REB×1.2 + AST×1.5 + STL×2 + BLK×2
 */
function compositeScore(p: LeaderRow): number {
  const reb = (p.oreb ?? 0) + (p.dreb ?? 0);
  return (
    (p.pts ?? 0) +
    reb * 1.2 +
    (p.ast ?? 0) * 1.5 +
    (p.stl ?? 0) * 2 +
    (p.blk ?? 0) * 2
  );
}

interface PlayerOfTheWeek {
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

interface MvpCandidate {
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

export default async function AwardsPage() {
  const leaders = await getLeaders();

  let potw: PlayerOfTheWeek | null = null;
  let mvpTop5: MvpCandidate[] = [];

  if (leaders.length > 0) {
    // Player of the Week — highest composite per-game score
    const sorted = [...leaders].sort(
      (a, b) => compositeScore(b) - compositeScore(a),
    );
    const top = sorted[0]!;
    const reb = (top.oreb ?? 0) + (top.dreb ?? 0);
    potw = {
      player_id: top.player_id,
      player_name: top.player_name,
      player_name_latin: top.player_name_latin,
      player_photo_url: top.player_photo_url ?? top.photo_url,
      team_name: top.team_name,
      team_short_code: top.team_short_code,
      team_primary_color: top.team_primary_color,
      team_logo_url: top.team_logo_url,
      team_slug: top.team_slug,
      pts: top.pts ?? 0,
      reb,
      ast: top.ast ?? 0,
      stl: top.stl ?? 0,
      blk: top.blk ?? 0,
      gp: top.gp,
      score: compositeScore(top),
    };

    // MVP Race — top 5 by cumulative season impact
    const withCumulative = leaders.map((p) => ({
      player_id: p.player_id,
      player_name: p.player_name,
      player_name_latin: p.player_name_latin,
      player_photo_url: p.player_photo_url ?? p.photo_url,
      team_name: p.team_name,
      team_short_code: p.team_short_code,
      team_primary_color: p.team_primary_color,
      team_logo_url: p.team_logo_url,
      team_slug: p.team_slug,
      pts: p.pts ?? 0,
      reb: (p.oreb ?? 0) + (p.dreb ?? 0),
      ast: p.ast ?? 0,
      stl: p.stl ?? 0,
      blk: p.blk ?? 0,
      gp: p.gp,
      cumulativeScore: compositeScore(p) * p.gp,
    }));
    withCumulative.sort((a, b) => b.cumulativeScore - a.cumulativeScore);
    mvpTop5 = withCumulative.slice(0, 5);
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Сагсан бөмбөгийн лиг
        </p>
        <h1 className="mt-2 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
          Наградууд
        </h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Долооны шилдэг тоглогч болон улирлын MVP уралдааны тэргүүлэгчид.
        </p>
      </header>

      <AwardCards potw={potw} mvpTop5={mvpTop5} />
    </main>
  );
}
