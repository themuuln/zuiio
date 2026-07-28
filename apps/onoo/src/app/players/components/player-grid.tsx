"use client";

import { LayoutGrid, List, Search, Users, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PlayerAvatar } from "@/components/player-avatar";
import { TeamLogo } from "@/components/team-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { PublicEmptyState } from "../../components/public-empty-state";
import type { PlayerDirectoryRow } from "../../lib/shared";

interface PlayerGridProps {
  players: PlayerDirectoryRow[];
  initialSearch?: string;
  className?: string;
}

type SortKey = "points" | "rebounds" | "assists" | "name";

function formatStat(value: number | null): string {
  return value?.toFixed(1) ?? "—";
}

export function PlayerGrid({
  players,
  initialSearch = "",
  className,
}: PlayerGridProps) {
  const [search, setSearch] = useState(initialSearch);
  const [teamFilter, setTeamFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("points");

  const teams = useMemo(
    () =>
      Array.from(new Map(players.map((p) => [p.team_slug, p.team_name])))
        .map(([slug, name]) => ({ slug, name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [players],
  );

  const positions = useMemo(
    () =>
      Array.from(
        new Set(
          players
            .map((p) => p.player_position)
            .filter((p): p is string => Boolean(p)),
        ),
      ).sort(),
    [players],
  );

  const filteredPlayers = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("mn");
    return players
      .filter((p) => {
        const matchesSearch =
          normalizedSearch.length === 0 ||
          p.player_name.toLocaleLowerCase("mn").includes(normalizedSearch) ||
          (p.player_name_latin?.toLocaleLowerCase("en") ?? "").includes(
            normalizedSearch,
          ) ||
          p.team_name.toLocaleLowerCase("mn").includes(normalizedSearch);
        const matchesTeam = teamFilter === "all" || p.team_slug === teamFilter;
        const matchesPosition =
          positionFilter === "all" || p.player_position === positionFilter;
        return matchesSearch && matchesTeam && matchesPosition;
      })
      .sort((a, b) => {
        if (sortKey === "name")
          return a.player_name.localeCompare(b.player_name, "mn");
        if (sortKey === "rebounds")
          return (b.rebounds_per_game ?? 0) - (a.rebounds_per_game ?? 0);
        if (sortKey === "assists")
          return (b.assists_per_game ?? 0) - (a.assists_per_game ?? 0);
        return (b.points_per_game ?? 0) - (a.points_per_game ?? 0);
      });
  }, [players, search, sortKey, teamFilter, positionFilter]);

  const hasActiveFilters =
    search.length > 0 || teamFilter !== "all" || positionFilter !== "all";

  function clearFilters() {
    setSearch("");
    setTeamFilter("all");
    setPositionFilter("all");
  }

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* ── Compact toolbar — sticky ── */}
      <div className="sticky top-[96px] z-10 -mx-4 flex flex-wrap items-end gap-3 bg-[var(--surface-2)] px-4 pt-4 pb-3 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {/* Search */}
        <div className="relative min-w-[180px] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Тоглогч хайх..."
            aria-label="Тоглогч хайх"
            className="h-9 pl-9"
          />
        </div>

        {/* Team filter */}
        <Select value={teamFilter} onValueChange={setTeamFilter}>
          <SelectTrigger className="h-9 w-[160px]" aria-label="Багаар шүүх">
            <SelectValue placeholder="Бүх баг" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Бүх баг</SelectItem>
              {teams.map(({ slug, name }) => (
                <SelectItem key={slug} value={slug}>
                  {name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* Position filter */}
        <Select value={positionFilter} onValueChange={setPositionFilter}>
          <SelectTrigger className="h-9 w-[140px]" aria-label="Байрлалаар шүүх">
            <SelectValue placeholder="Бүх байрлал" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Бүх байрлал</SelectItem>
              {positions.map((position) => (
                <SelectItem key={position} value={position}>
                  {position}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select
          value={sortKey}
          onValueChange={(value) => setSortKey(value as SortKey)}
        >
          <SelectTrigger className="h-9 w-[140px]" aria-label="Эрэмбэлэх">
            <SelectValue placeholder="Эрэмбэлэх" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="points">Оноогоор</SelectItem>
              <SelectItem value="rebounds">Самбараар</SelectItem>
              <SelectItem value="assists">Дамжуулалтаар</SelectItem>
              <SelectItem value="name">Нэрээр</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* Player count badge */}
        <Badge variant="secondary" className="h-9 px-3 text-xs font-semibold">
          {filteredPlayers.length} тоглогч
        </Badge>
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {search && (
            <Badge variant="outline">
              &ldquo;{search}&rdquo;
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label={`Хайлт устгах: ${search}`}
                className="ml-0.5 inline-flex size-3.5 items-center justify-center rounded-full hover:bg-foreground/10"
              >
                <X className="size-2.5" aria-hidden="true" />
              </button>
            </Badge>
          )}
          {teamFilter !== "all" && (
            <Badge variant="outline">
              {teams.find((t) => t.slug === teamFilter)?.name ?? teamFilter}
              <button
                type="button"
                onClick={() => setTeamFilter("all")}
                aria-label="Багийн шүүлт устгах"
                className="ml-0.5 inline-flex size-3.5 items-center justify-center rounded-full hover:bg-foreground/10"
              >
                <X className="size-2.5" aria-hidden="true" />
              </button>
            </Badge>
          )}
          {positionFilter !== "all" && (
            <Badge variant="outline">
              {positionFilter}
              <button
                type="button"
                onClick={() => setPositionFilter("all")}
                aria-label="Байрлалын шүүлт устгах"
                className="ml-0.5 inline-flex size-3.5 items-center justify-center rounded-full hover:bg-foreground/10"
              >
                <X className="size-2.5" aria-hidden="true" />
              </button>
            </Badge>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFilters}
          >
            Бүгд устгах
          </Button>
        </div>
      )}

      {/* ── Grid / Table views ── */}
      <div className="mt-4">
        {filteredPlayers.length === 0 ? (
          <PublicEmptyState
            icon={Users}
            title="Тоглогч олдсонгүй"
            description="Хайх нөхцөлөө өөрчилж эсвэл шүүлтүүрээ цэвэрлээрэй."
          >
            <Button type="button" onClick={clearFilters}>
              Шүүлтүүр цэвэрлэх
            </Button>
          </PublicEmptyState>
        ) : (
          <Tabs defaultValue="cards" className="flex flex-col gap-4">
            <TabsList variant="line">
              <TabsTrigger value="cards">
                <LayoutGrid className="mr-1.5 size-3.5" aria-hidden="true" />
                Хүснэгт
              </TabsTrigger>
              <TabsTrigger value="table">
                <List className="mr-1.5 size-3.5" aria-hidden="true" />
                Жагсаалт
              </TabsTrigger>
            </TabsList>

            {/* Card grid view */}
            <TabsContent value="cards">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPlayers.map((player) => (
                  <PlayerCard key={player.player_id} player={player} />
                ))}
              </div>
            </TabsContent>

            {/* Table view */}
            <TabsContent value="table">
              <Card className="shadow-none">
                <CardContent className="overflow-x-auto p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Тоглогч</TableHead>
                        <TableHead>Баг</TableHead>
                        <TableHead className="hidden sm:table-cell">
                          Байрлал
                        </TableHead>
                        <TableHead className="text-right">ТТ</TableHead>
                        <TableHead className="text-right">ОНОО</TableHead>
                        <TableHead className="text-right">САМБ</TableHead>
                        <TableHead className="text-right">ДАМЖ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPlayers.map((player) => (
                        <TableRow key={player.player_id}>
                          <TableCell>
                            <Link
                              href={`/players/${player.player_id}`}
                              className="font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                              {player.player_name}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <TeamLogo
                                logoUrl={player.team_logo_url}
                                shortCode={player.team_short_code}
                                primaryColor={player.team_primary_color}
                                size="sm"
                              />
                              <Link
                                href={`/teams/${player.team_slug}`}
                                className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              >
                                {player.team_name}
                              </Link>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {player.player_position ?? (
                              <span className="text-muted-foreground/50">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {player.games_played ?? 0}
                          </TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">
                            {formatStat(player.points_per_game)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatStat(player.rebounds_per_game)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatStat(player.assists_per_game)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Player card
// ---------------------------------------------------------------------------

interface PlayerCardProps {
  player: PlayerDirectoryRow;
  rank?: number;
  className?: string;
}

function PlayerCard({ player, rank, className }: PlayerCardProps) {
  return (
    <Link
      href={`/players/${player.player_id}`}
      className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card
        className={cn(
          "h-full overflow-hidden transition-[box-shadow,transform] group-hover:shadow-md group-active:scale-[0.98] motion-reduce:transition-none",
          className,
        )}
      >
        <CardHeader className="pb-0">
          <div className="flex items-center gap-3">
            <PlayerAvatar
              photoUrl={player.photo_url}
              name={player.player_name}
              primaryColor={player.team_primary_color}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="truncate text-base">
                  {player.player_name}
                </CardTitle>
                {player.player_position && (
                  <Badge
                    variant="outline"
                    className="shrink-0 px-1.5 text-[10px] font-semibold uppercase tracking-wider"
                  >
                    {player.player_position}
                  </Badge>
                )}
              </div>
              <CardDescription className="mt-0.5 flex items-center gap-1.5">
                <TeamLogo
                  logoUrl={player.team_logo_url}
                  shortCode={player.team_short_code}
                  primaryColor={player.team_primary_color}
                  size="sm"
                />
                <span className="truncate text-xs">{player.team_name}</span>
                {player.games_played != null && (
                  <span className="ml-auto text-[10px] text-muted-foreground/60">
                    {player.games_played} ТТ
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="mt-3 grid grid-cols-3 divide-x divide-border/40 border-t border-border/40 bg-[var(--surface-2)]/50 px-4 py-2.5">
          <PlayerStat label="ОНОО" value={formatStat(player.points_per_game)} />
          <PlayerStat
            label="САМБ"
            value={formatStat(player.rebounds_per_game)}
          />
          <PlayerStat
            label="ДАМЖ"
            value={formatStat(player.assists_per_game)}
          />
        </CardContent>
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Stat cell
// ---------------------------------------------------------------------------

interface PlayerStatProps {
  label: string;
  value: string;
}

function PlayerStat({ label, value }: PlayerStatProps) {
  return (
    <div className="text-center first:pl-0 last:pr-0">
      <p className="font-display text-lg leading-none tracking-tight">
        {value}
      </p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

interface PlayerGridSkeletonProps {
  className?: string;
}

export function PlayerGridSkeleton({ className }: PlayerGridSkeletonProps) {
  const placeholders = [
    "player-one",
    "player-two",
    "player-three",
    "player-four",
    "player-five",
    "player-six",
  ];

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {placeholders.map((placeholder) => (
        <Card key={placeholder} className="shadow-none" aria-hidden="true">
          <CardHeader className="pb-0">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="mt-3 grid grid-cols-3 gap-0 border-t border-border/40 px-4 py-2.5">
            <Skeleton className="mx-auto h-5 w-8" />
            <Skeleton className="mx-auto h-5 w-8" />
            <Skeleton className="mx-auto h-5 w-8" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
