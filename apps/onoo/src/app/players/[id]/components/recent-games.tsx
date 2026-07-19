import { formatInTimeZone } from "date-fns-tz";
import { Activity, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { PlayerGameLine } from "@/app/lib/shared";
import { generatePlayerGameSummary } from "@/app/lib/summaries";
import { TeamLogo } from "@/components/team-logo";
import { cn } from "@/lib/utils";

interface RecentGamesProps {
  gameLines: PlayerGameLine[];
  className?: string;
}

function getStandoutStat(line: PlayerGameLine): string {
  // Rebounds and assists are weighted to surface all-around performances,
  // not only the highest raw counter.
  const candidates = [
    { value: line.pts, weight: 1, label: "оноо" },
    {
      value: line.oreb + line.dreb,
      weight: 1.2,
      label: "буулт",
    },
    {
      value: line.ast,
      weight: 1.5,
      label: "олголт",
    },
  ];
  const best = candidates.reduce((current, candidate) =>
    current.value * current.weight > candidate.value * current.weight
      ? current
      : candidate,
  );

  return `${best.value} ${best.label}`;
}

export function RecentGames({ gameLines, className }: RecentGamesProps) {
  const lastFive = gameLines.slice(-5).reverse();

  return (
    <section
      aria-labelledby="recent-heading"
      className={cn("space-y-4", className)}
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--brand-sports)]">
            {
              "Тоглолтын хэмнэл"
            }
          </p>
          <h2
            id="recent-heading"
            className="mt-1 text-xl font-bold tracking-tight"
          >
            {
              "Сүүлийн тоглотууд"
            }
          </h2>
        </div>
        {lastFive.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {
              "Шинэ → хуучин"
            }
          </span>
        )}
      </div>

      {lastFive.length > 0 ? (
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0">
          {lastFive.map((line) => (
            <Link
              key={line.game_id}
              href={`/games/${line.game_id}`}
              className="group w-48 shrink-0 snap-start overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-md active:translate-y-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:w-auto motion-reduce:transform-none motion-reduce:transition-none"
            >
              {/* W/L color strip */}
              <div
                className={cn(
                  "h-1",
                  line.result === "W" ? "bg-success" : "bg-destructive",
                )}
                aria-hidden="true"
              />

              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <TeamLogo
                    logoUrl={line.opponent_logo_url}
                    shortCode={line.opponent_short_code}
                    size="md"
                  />
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-black",
                      line.result === "W"
                        ? "bg-success text-success-foreground"
                        : "bg-destructive text-destructive-foreground",
                    )}
                  >
                    {line.result}
                  </span>
                </div>

                <div className="mt-4">
                  <p className="truncate text-sm font-semibold">
                    {line.opponent_name}
                  </p>
                  <p className="stat-number text-2xl tracking-tight">
                    {line.team_score}–{line.opponent_score}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-snug italic text-muted-foreground">
                    {generatePlayerGameSummary({
                      player_name: line.player_name,
                      pts: line.pts,
                      reb: line.oreb + line.dreb,
                      ast: line.ast,
                      stl: line.stl,
                      blk: line.blk,
                      fgm: line.fgm,
                      fga: line.fga,
                      result: line.result,
                      team_score: line.team_score,
                      opponent_score: line.opponent_score,
                      opponent_short_code: line.opponent_short_code,
                    })}
                  </p>
                </div>

                <div className="mt-4 flex items-end justify-between gap-2 border-t pt-3">
                  <div>
                    <p className="text-sm font-bold tabular-nums">
                      {getStandoutStat(line)}
                    </p>
                    <time
                      dateTime={line.game_date}
                      className="mt-0.5 block text-xs text-muted-foreground tabular-nums"
                    >
                      {formatInTimeZone(
                        new Date(line.game_date),
                        "Asia/Ulaanbaatar",
                        "MM.dd",
                      )}
                    </time>
                  </div>
                  <ArrowUpRight
                    className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/30 px-6 text-center">
          <Activity
            className="size-6 text-muted-foreground"
            aria-hidden="true"
          />
          <h3 className="mt-3 font-semibold">
            {
              "Тоглолтын мэдээл хараахан алга"
            }
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {
              "Баталгаажсан тоглолтын дараа сүүлийн форм энд харгагдана."
            }
          </p>
        </div>
      )}
    </section>
  );
}
