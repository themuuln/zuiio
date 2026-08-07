"use client";

import { Gamepad2, Search, SearchX, Shield, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PlayerAvatar } from "@/components/player-avatar";
import { TeamLogo } from "@/components/team-logo";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { GameStatusBadge } from "../../components/game-status-badge";
import { PublicEmptyState } from "../../components/public-empty-state";
import type {
  GameWithTeams,
  PlayerDirectoryRow,
  SearchAllResult,
  StandingRow,
} from "../../lib/shared";
import { formatGameTime } from "../../lib/shared";

interface SearchResultsProps {
  initialQuery: string;
  initialResults: SearchAllResult;
  className?: string;
}

type TabValue = "all" | "players" | "teams" | "games";

const TABS: { value: TabValue; label: string; icon: typeof Users }[] = [
  { value: "all", label: "Бүгд", icon: Users },
  { value: "players", label: "Тоглогчид", icon: Users },
  { value: "teams", label: "Багууд", icon: Shield },
  { value: "games", label: "Тоглолтууд", icon: Gamepad2 },
];

export function SearchResults({
  initialQuery,
  initialResults,
  className,
}: SearchResultsProps) {
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [results, setResults] = useState<SearchAllResult>(initialResults);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<number>(null);
  const listRef = useRef<HTMLElement>(null);
  const [focusIndex, setFocusIndex] = useState(-1);

  const fetchResults = useCallback(async (q: string) => {
    if (q.trim().length === 0) {
      setResults({ players: [], teams: [], games: [] });
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ q });
      const res = await fetch(`/api/search?${params.toString()}`);
      if (res.ok) {
        const data: SearchAllResult = await res.json();
        setResults(data);
      }
    } catch {
      // Network error — keep previous results
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      setFocusIndex(-1);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        fetchResults(value);
      }, 300);
    },
    [fetchResults],
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Sync initial results when query changes via URL
  useEffect(() => {
    setResults(initialResults);
  }, [initialResults]);

  const filteredPlayers = useMemo(
    () => filterList(results.players, query),
    [results.players, query],
  );
  const filteredTeams = useMemo(
    () => filterList(results.teams, query),
    [results.teams, query],
  );
  const filteredGames = useMemo(
    () => filterGames(results.games, query),
    [results.games, query],
  );

  const totalCount =
    filteredPlayers.length + filteredTeams.length + filteredGames.length;

  // Flat list of visible items for keyboard navigation
  const flatItems = useMemo(() => {
    const items: { type: "player" | "team" | "game"; href: string }[] = [];
    if (activeTab === "all" || activeTab === "players") {
      for (const p of filteredPlayers) {
        items.push({ type: "player", href: `/players/${p.player_id}` });
      }
    }
    if (activeTab === "all" || activeTab === "teams") {
      for (const t of filteredTeams) {
        items.push({ type: "team", href: `/teams/${t.team_slug}` });
      }
    }
    if (activeTab === "all" || activeTab === "games") {
      for (const g of filteredGames) {
        items.push({ type: "game", href: `/games/${g.id}` });
      }
    }
    return items;
  }, [activeTab, filteredPlayers, filteredTeams, filteredGames]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (flatItems.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1));
      }
    },
    [flatItems.length],
  );

  // Scroll focused item into view
  useEffect(() => {
    if (focusIndex < 0) return;
    const el = listRef.current?.querySelector(
      `[data-result-index="${focusIndex}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [focusIndex]);

  const hasQuery = query.trim().length > 0;

  return (
    <search
      className={cn("flex flex-col gap-6", className)}
      onKeyDown={handleKeyDown}
    >
      {/* Search input */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Нэр, баг эсвэл тоглолт хайх..."
          aria-label="Хайлтын талбар"
          className="pl-9"
          autoFocus
        />
      </div>

      {/* Tabs with counts */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v as TabValue);
          setFocusIndex(-1);
        }}
      >
        <div className="overflow-x-auto pb-1">
          <TabsList variant="line">
            {TABS.map((tab) => {
              const count =
                tab.value === "players"
                  ? filteredPlayers.length
                  : tab.value === "teams"
                    ? filteredTeams.length
                    : tab.value === "games"
                      ? filteredGames.length
                      : filteredPlayers.length +
                        filteredTeams.length +
                        filteredGames.length;
              return (
                <TabsTrigger key={tab.value} value={tab.value}>
                  <tab.icon className="size-3.5" aria-hidden="true" />
                  {tab.label}
                  {hasQuery && (
                    <Badge
                      variant="secondary"
                      className="ml-1 px-1.5 py-0 text-[10px]"
                    >
                      {count}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Results */}
        <section
          ref={listRef}
          aria-label="Хайлтын үр дүн"
          className="flex flex-col gap-4"
        >
          {loading && hasQuery ? (
            <SearchSkeleton />
          ) : !hasQuery ? (
            <div className="py-12 text-center text-muted-foreground">
              <Search
                className="mx-auto mb-3 size-8 opacity-40"
                aria-hidden="true"
              />
              <p>Хайх үгээ бичнэ үү.</p>
            </div>
          ) : totalCount === 0 ? (
            <PublicEmptyState
              icon={SearchX}
              title="Үр дүн олдсонгүй"
              description={`"${query}" гэсэн хайлтад тохирох зүйл олдсонгүй. Өөр үгээр оролдоно уу.`}
            />
          ) : (
            <>
              <TabsContent value="all" className="flex flex-col gap-6">
                {filteredPlayers.length > 0 && (
                  <ResultSection
                    title="Тоглогчид"
                    count={filteredPlayers.length}
                    type="player"
                    focusIndex={focusIndex}
                    offset={0}
                  >
                    {filteredPlayers.map((player, i) => (
                      <PlayerResultCard
                        key={player.player_id}
                        player={player}
                        dataResultIndex={i}
                        focused={focusIndex === i}
                      />
                    ))}
                  </ResultSection>
                )}
                {filteredTeams.length > 0 && (
                  <ResultSection
                    title="Багууд"
                    count={filteredTeams.length}
                    type="team"
                    focusIndex={focusIndex}
                    offset={filteredPlayers.length}
                  >
                    {filteredTeams.map((team, i) => (
                      <TeamResultCard
                        key={team.team_season_id}
                        team={team}
                        dataResultIndex={filteredPlayers.length + i}
                        focused={focusIndex === filteredPlayers.length + i}
                      />
                    ))}
                  </ResultSection>
                )}
                {filteredGames.length > 0 && (
                  <ResultSection
                    title="Тоглолтууд"
                    count={filteredGames.length}
                    type="game"
                    focusIndex={focusIndex}
                    offset={filteredPlayers.length + filteredTeams.length}
                  >
                    {filteredGames.map((game, i) => (
                      <GameResultCard
                        key={game.id}
                        game={game}
                        dataResultIndex={
                          filteredPlayers.length + filteredTeams.length + i
                        }
                        focused={
                          focusIndex ===
                          filteredPlayers.length + filteredTeams.length + i
                        }
                      />
                    ))}
                  </ResultSection>
                )}
              </TabsContent>

              <TabsContent value="players">
                {filteredPlayers.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredPlayers.map((player, i) => (
                      <PlayerResultCard
                        key={player.player_id}
                        player={player}
                        dataResultIndex={i}
                        focused={focusIndex === i}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyTabState query={query} tabLabel="тоглогч" />
                )}
              </TabsContent>

              <TabsContent value="teams">
                {filteredTeams.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredTeams.map((team, i) => (
                      <TeamResultCard
                        key={team.team_season_id}
                        team={team}
                        dataResultIndex={i}
                        focused={focusIndex === i}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyTabState query={query} tabLabel="баг" />
                )}
              </TabsContent>

              <TabsContent value="games">
                {filteredGames.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredGames.map((game, i) => (
                      <GameResultCard
                        key={game.id}
                        game={game}
                        dataResultIndex={i}
                        focused={focusIndex === i}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyTabState query={query} tabLabel="тоглолт" />
                )}
              </TabsContent>
            </>
          )}
        </section>
      </Tabs>
    </search>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ResultSectionProps {
  title: string;
  count: number;
  type: "player" | "team" | "game";
  focusIndex: number;
  offset: number;
  children: React.ReactNode;
}

function ResultSection({ title, count, children }: ResultSectionProps) {
  return (
    <section aria-labelledby={`search-section-${title}`}>
      <div className="mb-3 flex items-center gap-2">
        <h2 id={`search-section-${title}`} className="text-sm font-semibold">
          {title}
        </h2>
        <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
          {count}
        </Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

interface PlayerResultCardProps {
  player: PlayerDirectoryRow;
  dataResultIndex: number;
  focused: boolean;
}

function PlayerResultCard({
  player,
  dataResultIndex,
  focused,
}: PlayerResultCardProps) {
  return (
    <Link
      href={`/players/${player.player_id}`}
      prefetch={false}
      data-result-index={dataResultIndex}
      role="listitem"
      className={cn(
        "group rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        focused && "ring-2 ring-ring ring-offset-2",
      )}
    >
      <Card className="h-full shadow-none transition-[box-shadow,transform] group-hover:shadow-md group-active:scale-[0.98] motion-reduce:transition-none">
        <CardContent className="flex items-center gap-3 p-4">
          <PlayerAvatar
            photoUrl={player.photo_url}
            name={player.player_name}
            primaryColor={player.team_primary_color}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{player.player_name}</p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TeamLogo
                logoUrl={player.team_logo_url}
                shortCode={player.team_short_code}
                primaryColor={player.team_primary_color}
                size="sm"
              />
              <span className="truncate">{player.team_name}</span>
            </p>
          </div>
          <div className="flex shrink-0 gap-3 text-right text-xs tabular-nums text-muted-foreground">
            <span>
              <span className="block text-base font-bold text-foreground">
                {player.points_per_game?.toFixed(1) ?? "—"}
              </span>
              оноо
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

interface TeamResultCardProps {
  team: StandingRow;
  dataResultIndex: number;
  focused: boolean;
}

function TeamResultCard({
  team,
  dataResultIndex,
  focused,
}: TeamResultCardProps) {
  return (
    <Link
      href={`/teams/${team.team_slug}`}
      prefetch={false}
      data-result-index={dataResultIndex}
      role="listitem"
      className={cn(
        "group rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        focused && "ring-2 ring-ring ring-offset-2",
      )}
    >
      <Card className="h-full shadow-none transition-[box-shadow,transform] group-hover:shadow-md group-active:scale-[0.98] motion-reduce:transition-none">
        <CardContent className="flex items-center gap-3 p-4">
          <TeamLogo
            logoUrl={team.team_logo_url}
            shortCode={team.team_short_code}
            primaryColor={team.team_primary_color}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{team.team_name}</p>
            <p className="text-xs text-muted-foreground">
              {team.wins} хожил · {team.losses} хожигдол
            </p>
          </div>
          <Badge variant="outline" className="shrink-0 tabular-nums">
            {(team.win_pct * 100).toFixed(0)}%
          </Badge>
        </CardContent>
      </Card>
    </Link>
  );
}

interface GameResultCardProps {
  game: GameWithTeams;
  dataResultIndex: number;
  focused: boolean;
}

function GameResultCard({
  game,
  dataResultIndex,
  focused,
}: GameResultCardProps) {
  return (
    <Link
      prefetch={false}
      href={`/games/${game.id}`}
      data-result-index={dataResultIndex}
      role="listitem"
      className={cn(
        "group rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        focused && "ring-2 ring-ring ring-offset-2",
      )}
    >
      <Card className="h-full shadow-none transition-[box-shadow,transform] group-hover:shadow-md group-active:scale-[0.98] motion-reduce:transition-none">
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex items-center gap-2">
            <GameStatusBadge game={game} />
          </div>
          <div className="grid grid-cols-3 items-center gap-2">
            <div className="flex min-w-0 flex-col items-center gap-1 text-center">
              <TeamLogo
                logoUrl={game.home_team_logo_url}
                shortCode={game.home_team_short_code}
                primaryColor={game.home_team_primary_color}
                size="sm"
              />
              <span className="truncate text-xs font-medium">
                {game.home_team_name}
              </span>
            </div>
            <div className="text-center">
              {game.status !== "scheduled" && game.home_score !== null ? (
                <span className="stat-number text-lg font-bold tabular-nums">
                  {game.home_score ?? 0}
                  <span className="px-0.5 text-muted-foreground">–</span>
                  {game.away_score ?? 0}
                </span>
              ) : (
                <span className="text-xs tabular-nums text-muted-foreground">
                  {formatGameTime(game.scheduled_at)}
                </span>
              )}
            </div>
            <div className="flex min-w-0 flex-col items-center gap-1 text-center">
              <TeamLogo
                logoUrl={game.away_team_logo_url}
                shortCode={game.away_team_short_code}
                primaryColor={game.away_team_primary_color}
                size="sm"
              />
              <span className="truncate text-xs font-medium">
                {game.away_team_name}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function EmptyTabState({
  query,
  tabLabel,
}: {
  query: string;
  tabLabel: string;
}) {
  return (
    <div className="py-8 text-center text-sm text-muted-foreground">
      <SearchX className="mx-auto mb-2 size-6 opacity-40" aria-hidden="true" />
      &quot;{query}&quot; гэсэн хайлтад тохирох {tabLabel} олдсонгүй.
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div
      role="status"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      aria-label="Хайлтын үр дүн ачаалж байна"
      aria-busy="true"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
        <Card key={i} className="shadow-none" aria-hidden="true">
          <CardContent className="flex items-center gap-3 p-4">
            <Skeleton className="size-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function matchesQuery(text: string | null | undefined, q: string): boolean {
  if (!text) return false;
  return text.toLocaleLowerCase("mn").includes(q.toLocaleLowerCase("mn"));
}

function filterList<T extends Record<string, unknown>>(
  items: T[],
  query: string,
): T[] {
  const q = query.trim().toLocaleLowerCase("mn");
  if (q.length === 0) return items;
  return items.filter((item) => {
    // Search across all string fields
    return Object.values(item).some(
      (v) => typeof v === "string" && matchesQuery(v, q),
    );
  });
}

function filterGames(games: GameWithTeams[], query: string): GameWithTeams[] {
  const q = query.trim().toLocaleLowerCase("mn");
  if (q.length === 0) return games;
  return games.filter(
    (g) =>
      matchesQuery(g.home_team_name, q) ||
      matchesQuery(g.away_team_name, q) ||
      matchesQuery(g.competition_name, q),
  );
}
