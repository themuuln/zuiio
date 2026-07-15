import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { TeamLogo } from "@/components/team-logo";

interface GameLine {
  game_id: string;
  game_date: string;
  opponent: string;
  pts: number;
  reb: number;
  ast: number;
  result: "W" | "L";
}

interface RecentGamesProps {
  gameLines: GameLine[];
}

function standoutStat(line: GameLine): string {
  const candidates = [
    { value: line.pts, weight: 1, label: "оноо" },
    { value: line.reb, weight: 1.2, label: "самбар" },
    { value: line.ast, weight: 1.5, label: "дамжуулалт" },
  ];
  const best = candidates.reduce((a, b) =>
    a.value * a.weight > b.value * b.weight ? a : b,
  );
  return `${best.value} ${best.label}`;
}

export function RecentGames({ gameLines }: RecentGamesProps) {
  const last5 = gameLines.slice(-5).reverse();

  if (last5.length === 0) return null;

  return (
    <section aria-labelledby="recent-heading" className="space-y-3">
      <h2 id="recent-heading" className="text-xl font-semibold">
        Сүүлийн 5 тоглолт
      </h2>
      <div
        className="flex gap-3 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: "thin" }}
      >
        {last5.map((line) => (
          <Link
            key={line.game_id}
            href={`/games/${line.game_id}`}
            className="snap-start shrink-0 w-[140px] rounded-xl border bg-card p-3 transition-colors hover:bg-accent/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <div className="flex items-center gap-2 mb-2">
              <TeamLogo shortCode={line.opponent} size="sm" />
              <span className="text-sm font-semibold truncate">
                {line.opponent}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span
                className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none text-white"
                style={{
                  backgroundColor:
                    line.result === "W"
                      ? "oklch(0.64 0.18 145)"
                      : "oklch(0.60 0.22 25)",
                }}
              >
                {line.result === "W" ? "W" : "L"}
              </span>
            </div>
            <p className="text-sm font-semibold tabular-nums">
              {standoutStat(line)}
            </p>
            <time
              dateTime={line.game_date}
              className="mt-1.5 block text-[11px] text-muted-foreground tabular-nums"
            >
              {formatInTimeZone(
                new Date(line.game_date),
                "Asia/Ulaanbaatar",
                "M/d",
              )}
            </time>
          </Link>
        ))}
      </div>
    </section>
  );
}
