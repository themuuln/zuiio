import {
  ChevronRight,
  Minus,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { PlayerAvatar } from "@/components/player-avatar";
import { TeamLogo } from "@/components/team-logo";
import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import type { LeaderRow, StandingRow } from "../lib/shared";
import { PublicEmptyState } from "./public-empty-state";

interface HomeStandingsLeadersProps {
  standings: StandingRow[];
  leaders: LeaderRow[];
}

function formatAverage(value: number | null | undefined): string {
  if (value == null) return "—";
  return Number(value).toFixed(1);
}

/**
 * Deduplicate leaders by player — the v_public_leaders view can return one
 * row per competition for the same player. Keep the best points row.
 */
function dedupeLeaders(leaders: LeaderRow[]): LeaderRow[] {
  const best = new Map<string, LeaderRow>();
  for (const row of leaders) {
    const current = best.get(row.player_id);
    if (!current || (row.pts ?? 0) > (current.pts ?? 0)) {
      best.set(row.player_id, row);
    }
  }
  return [...best.values()];
}

function StreakChip({ streak }: { streak: string | null }) {
  if (!streak) return <span className="text-muted-foreground/40">—</span>;
  const first = streak.charAt(0);
  const count = streak.slice(1);
  if (first === "W") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500">
        <TrendingUp className="size-3.5" aria-hidden="true" />
        {count}
      </span>
    );
  }
  if (first === "L") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-500">
        <TrendingDown className="size-3.5" aria-hidden="true" />
        {count}
      </span>
    );
  }
  return (
    <Minus className="size-3.5 text-muted-foreground/40" aria-hidden="true" />
  );
}

const CATEGORIES = [
  {
    key: "reb",
    label: "Сэргэлт",
    value: (p: LeaderRow) => (p.oreb ?? 0) + (p.dreb ?? 0),
  },
  { key: "ast", label: "Олголт", value: (p: LeaderRow) => p.ast },
  { key: "stl", label: "Булаалт", value: (p: LeaderRow) => p.stl },
  { key: "blk", label: "Блок", value: (p: LeaderRow) => p.blk },
] as const;

/**
 * Standings + leaders band: points top-3, standings top-5 with streak, and
 * a compact one-row-per-category leaderboard. Auto-generated content that
 * refreshes after every verified game.
 */
export function HomeStandingsLeaders({
  standings,
  leaders,
}: HomeStandingsLeadersProps) {
  const uniqueLeaders = dedupeLeaders(leaders);
  const topScorers = [...uniqueLeaders]
    .sort((a, b) => (b.pts ?? 0) - (a.pts ?? 0))
    .slice(0, 3);

  return (
    <section className="flex flex-col gap-6">
      <div className="court-divider grid gap-6 rounded-xl bg-[var(--surface-1)] p-6 sm:p-8 lg:grid-cols-12">
        {/* Leaders top 3 — podium style */}
        <Card className="shadow-none lg:col-span-5">
          <CardHeader>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Лигийн шилдгүүд
              </p>
              <CardTitle className="mt-1 text-xl tracking-tight">
                Онооны тэргүүлэгчид
              </CardTitle>
            </div>
            <CardAction>
              <Button asChild variant="ghost" size="sm">
                <Link href="/leaders">Бүгд</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {topScorers.length > 0 ? (
              <ol className="flex flex-col gap-1">
                {topScorers.map((leader, index) => (
                  <li key={leader.player_id}>
                    <Link
                      href={`/players/${leader.player_id}`}
                      className={cn(
                        "flex items-center gap-3 rounded-lg p-3 transition-[background-color,transform] hover:bg-accent active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
                        index === 0 &&
                          "bg-[var(--surface-3)] ring-1 ring-[var(--brand-sports)]/20",
                      )}
                    >
                      <span
                        className={cn(
                          "w-5 text-sm font-black tabular-nums",
                          index === 0
                            ? "text-[var(--brand-sports)]"
                            : "text-muted-foreground",
                        )}
                      >
                        {index + 1}
                      </span>
                      <PlayerAvatar
                        photoUrl={leader.player_photo_url}
                        name={leader.player_name}
                        primaryColor={leader.team_primary_color}
                        size={index === 0 ? "md" : "sm"}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "truncate font-semibold",
                            index === 0 && "text-base",
                          )}
                        >
                          {leader.player_name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {leader.team_name}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "stat-number",
                          index === 0 ? "text-2xl" : "text-xl",
                        )}
                      >
                        {formatAverage(leader.pts)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            ) : (
              <PublicEmptyState
                icon={Users}
                title="Тэргүүлэгч тодроогүй байна"
                description="Тоглогчид шаардлагатай тоглолтын тоонд хүрэхэд эрэмбэ үүснэ."
              />
            )}
          </CardContent>
        </Card>

        {/* Standings top 5 — compact table with team colors + streak */}
        <Card className="shadow-none lg:col-span-7">
          <CardHeader>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Лигийн өрсөлдөөн
              </p>
              <CardTitle className="mt-1 text-xl tracking-tight">
                Шалгуурын эхний тав
              </CardTitle>
            </div>
            <CardAction>
              <Button asChild variant="ghost" size="sm">
                <Link href="/standings">Бүх шалгуур</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {standings.length > 0 ? (
              <ol className="flex flex-col gap-1">
                {standings.slice(0, 5).map((row, index) => (
                  <li key={row.team_season_id}>
                    <Link
                      href={`/teams/${row.team_slug}`}
                      className={cn(
                        "grid grid-cols-12 items-center gap-3 rounded-lg p-3 transition-[background-color,transform] hover:bg-accent active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
                        index === 0 &&
                          "bg-[var(--surface-3)] ring-1 ring-[var(--brand-sports)]/20",
                      )}
                    >
                      <span
                        className={cn(
                          "col-span-1 text-sm font-black tabular-nums",
                          index === 0
                            ? "text-[var(--brand-sports)]"
                            : "text-muted-foreground",
                        )}
                      >
                        {index + 1}
                      </span>
                      <span className="col-span-5 flex min-w-0 items-center gap-3">
                        <TeamLogo
                          logoUrl={row.team_logo_url}
                          shortCode={row.team_short_code}
                          primaryColor={row.team_primary_color}
                        />
                        <span
                          className={cn(
                            "truncate font-semibold",
                            index === 0 && "text-base",
                          )}
                        >
                          {row.team_name}
                        </span>
                      </span>
                      <span className="col-span-2 text-center text-sm tabular-nums text-muted-foreground">
                        {row.w}-{row.l}
                      </span>
                      <span className="col-span-2 flex justify-center">
                        <StreakChip streak={row.streak} />
                      </span>
                      <span
                        className={cn(
                          "col-span-2 text-right font-black tabular-nums",
                          index === 0 && "text-[var(--brand-sports)]",
                        )}
                      >
                        {(row.win_pct * 100).toFixed(1)}%
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            ) : (
              <PublicEmptyState
                icon={Trophy}
                title="Шалгуур хараахан үүсээгүй"
                description="Баталгаажсан эхний тоглолтын дараа багуудын байрлал энд шинэчлэгдэнэ."
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Compact per-category leaders — one row per category, #1 only */}
      {uniqueLeaders.length > 0 && (
        <section
          aria-labelledby="category-leaders-heading"
          className="flex flex-col gap-6 rounded-xl bg-[var(--surface-1)] p-6 sm:p-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Ангилал бүрийн шилдэг
              </p>
              <h2
                id="category-leaders-heading"
                className="mt-1 text-xl font-bold tracking-tight"
              >
                Шилдгүүд ангилал бүрээр
              </h2>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/leaders" className="gap-1">
                Бүгд <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            {CATEGORIES.map(({ key, label, value }) => {
              const top = [...uniqueLeaders]
                .filter((p) => (value(p) ?? 0) > 0)
                .sort((a, b) => (value(b) ?? 0) - (value(a) ?? 0))[0];
              return (
                <Card key={key} className="shadow-none">
                  <CardHeader>
                    <CardTitle className="text-base">{label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {top ? (
                      <Link
                        href={`/players/${top.player_id}`}
                        className="flex items-center gap-3 rounded-lg p-3 transition-[background-color,transform] hover:bg-accent active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
                      >
                        <PlayerAvatar
                          photoUrl={top.player_photo_url}
                          name={top.player_name}
                          primaryColor={top.team_primary_color}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">
                            {top.player_name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {top.team_name}
                          </p>
                        </div>
                        <span className="stat-number text-xl tabular-nums">
                          {formatAverage(value(top))}
                        </span>
                      </Link>
                    ) : (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        Мэдээлэл алга
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </section>
  );
}
