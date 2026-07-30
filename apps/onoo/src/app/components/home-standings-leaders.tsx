import { Trophy, Users } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { PlayerAvatar } from "@/components/player-avatar";
import { TeamLogo } from "@/components/team-logo";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getLeaders, getStandings } from "../lib/data";
import type { CompetitionRow } from "../lib/shared";
import { PublicEmptyState } from "./public-empty-state";

interface HomeStandingsLeadersProps {
  competitions: CompetitionRow[];
  activeCompetitionId: string | undefined;
}

/**
 * Below-the-fold section showing the top 3 leaders and top 5 standings.
 * Wrapped in its own Suspense boundary so it can stream in independently
 * without blocking the hero and featured content above.
 */
export function HomeStandingsLeaders(props: HomeStandingsLeadersProps) {
  return (
    <Suspense
      fallback={
        <div className="court-divider grid gap-6 rounded-xl bg-[var(--surface-1)] p-4 sm:p-6 lg:p-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <ContentSkeleton rows={3} />
          </div>
          <div className="lg:col-span-7">
            <ContentSkeleton rows={5} />
          </div>
        </div>
      }
    >
      <StandingsLeadersInner {...props} />
    </Suspense>
  );
}

/** @internal exported for testing */
export async function StandingsLeadersInner({
  competitions,
  activeCompetitionId,
}: HomeStandingsLeadersProps) {
  const [leaders, standings] = await Promise.all([
    getLeaders(),
    getStandings(),
  ]);

  const filteredLeaders = activeCompetitionId
    ? leaders.filter((l) => l.competition_id === activeCompetitionId)
    : leaders;
  const filteredStandings = activeCompetitionId
    ? standings.filter((s) => s.competition_id === activeCompetitionId)
    : standings;

  return (
    <section className="court-divider grid gap-6 rounded-xl bg-[var(--surface-1)] p-4 sm:p-6 lg:p-8 lg:grid-cols-12">
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
            <Link href="/leaders">
              <span className="text-sm font-medium">Бүгд</span>
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          {filteredLeaders.length > 0 ? (
            <ol className="flex flex-col gap-1">
              {filteredLeaders.slice(0, 3).map((leader, index) => (
                <li key={`${leader.player_id}-${leader.competition_id}`}>
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

      {/* Standings top 5 — compact table with team colors */}
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
            <Link href="/standings">
              <span className="text-sm font-medium">Бүх шалгуур</span>
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          {filteredStandings.length > 0 ? (
            <ol className="flex flex-col gap-1">
              {filteredStandings.slice(0, 5).map((row, index) => (
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
                    <span className="col-span-7 flex min-w-0 items-center gap-3">
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
                    <span className="col-span-2 text-right text-sm tabular-nums text-muted-foreground">
                      {row.win_pct ?? 0}
                    </span>
                    <span className="col-span-2 text-right text-sm tabular-nums font-semibold">
                      {row.wins}-{row.losses}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <PublicEmptyState
              icon={Trophy}
              title="Шалгуур хараахан гараагүй"
              description="Тэмцээн эхлэхэд багуудын шалгуурын хүснэгт энд гарна."
            />
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function formatAverage(value: number | null | undefined): string {
  if (value == null) return "—";
  if (Number.isInteger(value)) return value.toFixed(0);
  return value.toFixed(1);
}

function ContentSkeleton({ rows }: { rows: number }) {
  return (
    <div className="flex flex-col gap-3 p-4">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-4 w-48" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg p-3">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-6 w-10" />
        </div>
      ))}
    </div>
  );
}
