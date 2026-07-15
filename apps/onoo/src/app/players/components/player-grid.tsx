"use client";

import { ArrowRight, Search, SlidersHorizontal, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PlayerAvatar } from "@/components/player-avatar";
import { TeamLogo } from "@/components/team-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
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
import type { PlayerDirectoryRow } from "../../lib/data";

type SortKey = "points" | "rebounds" | "assists" | "name";

interface PlayerGridProps {
  players: PlayerDirectoryRow[];
  initialSearch?: string;
  className?: string;
}

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
      Array.from(
        new Map(players.map((player) => [player.team_slug, player.team_name])),
      ).sort((a, b) => a[1].localeCompare(b[1])),
    [players],
  );
  const positions = useMemo(
    () =>
      Array.from(
        new Set(
          players
            .map((player) => player.player_position)
            .filter((position): position is string => Boolean(position)),
        ),
      ).sort(),
    [players],
  );

  const filteredPlayers = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("mn");
    return players
      .filter((player) => {
        const matchesSearch =
          normalizedSearch.length === 0 ||
          player.player_name
            .toLocaleLowerCase("mn")
            .includes(normalizedSearch) ||
          player.player_name_latin
            ?.toLocaleLowerCase("en")
            .includes(normalizedSearch) ||
          player.team_name.toLocaleLowerCase("mn").includes(normalizedSearch);
        const matchesTeam =
          teamFilter === "all" || player.team_slug === teamFilter;
        const matchesPosition =
          positionFilter === "all" || player.player_position === positionFilter;
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
  }, [players, positionFilter, search, sortKey, teamFilter]);

  const featuredPlayers = players.slice(0, 3);
  const hasActiveFilters =
    search.length > 0 || teamFilter !== "all" || positionFilter !== "all";

  function clearFilters() {
    setSearch("");
    setTeamFilter("all");
    setPositionFilter("all");
  }

  return (
    <div className={cn("flex flex-col gap-8", className)}>
      {featuredPlayers.length > 0 && !hasActiveFilters ? (
        <section
          aria-labelledby="featured-players-heading"
          className="flex flex-col gap-4"
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Улирлын өнгө
              </p>
              <h2
                id="featured-players-heading"
                className="mt-1 text-2xl font-bold tracking-tight"
              >
                Онцлох тоглогчид
              </h2>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/players/compare">
                Харьцуулах
                <ArrowRight data-icon="inline-end" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {featuredPlayers.map((player, index) => (
              <PlayerCard
                key={player.player_id}
                player={player}
                rank={index + 1}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section
        aria-labelledby="player-directory-heading"
        className="flex flex-col gap-4"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Хайлт ба шүүлт
          </p>
          <h2
            id="player-directory-heading"
            className="mt-1 text-2xl font-bold tracking-tight"
          >
            Тоглогчдын сан
          </h2>
        </div>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              Шүүлтүүр
            </CardTitle>
            <CardDescription>
              Нэр, баг, байрлалаар шүүж хүссэн тоглогчоо олоорой.
            </CardDescription>
            <CardAction>
              <Badge variant="secondary">
                {filteredPlayers.length} тоглогч
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Нэр эсвэл баг"
                aria-label="Тоглогч хайх"
                className="pl-9"
              />
            </div>
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="w-full" aria-label="Багаар шүүх">
                <SelectValue placeholder="Бүх баг" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Бүх баг</SelectItem>
                  {teams.map(([slug, name]) => (
                    <SelectItem key={slug} value={slug}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="w-full" aria-label="Байрлалаар шүүх">
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
            <Select
              value={sortKey}
              onValueChange={(value) => setSortKey(value as SortKey)}
            >
              <SelectTrigger className="w-full" aria-label="Эрэмбэлэх">
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
          </CardContent>
        </Card>

        {filteredPlayers.length === 0 ? (
          <PublicEmptyState
            icon={Users}
            title="Тохирох тоглогч олдсонгүй"
            description="Хайлтын үгээ өөрчлөх эсвэл шүүлтүүрүүдийг цэвэрлэнэ үү."
          >
            <Button type="button" onClick={clearFilters}>
              Шүүлтүүр цэвэрлэх
            </Button>
          </PublicEmptyState>
        ) : (
          <Tabs defaultValue="cards" className="flex flex-col gap-4">
            <TabsList variant="line">
              <TabsTrigger value="cards">Карт</TabsTrigger>
              <TabsTrigger value="table">Хүснэгт</TabsTrigger>
            </TabsList>
            <TabsContent value="cards">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPlayers.map((player) => (
                  <PlayerCard key={player.player_id} player={player} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="table">
              <Card className="shadow-none">
                <CardContent className="overflow-x-auto p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Тоглогч</TableHead>
                        <TableHead>Баг</TableHead>
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
                              className="font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              {player.player_name}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/teams/${player.team_slug}`}
                              className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              {player.team_name}
                            </Link>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {player.games_played}
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
      </section>
    </div>
  );
}

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
          "h-full shadow-none transition-[background-color,transform] group-hover:bg-accent/40 group-active:scale-95 motion-reduce:transition-none",
          className,
        )}
      >
        <CardHeader>
          <div className="flex items-center gap-3">
            <PlayerAvatar
              photoUrl={player.photo_url}
              name={player.player_name}
              primaryColor={player.team_primary_color}
              size="lg"
            />
            <div className="min-w-0">
              <CardTitle className="truncate">{player.player_name}</CardTitle>
              <CardDescription className="mt-1 flex items-center gap-2">
                <TeamLogo
                  logoUrl={player.team_logo_url}
                  shortCode={player.team_short_code}
                  primaryColor={player.team_primary_color}
                  size="sm"
                />
                <span className="truncate">{player.team_name}</span>
              </CardDescription>
            </div>
          </div>
          {rank ? (
            <CardAction>
              <Badge variant="secondary">#{rank}</Badge>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-3">
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

interface PlayerStatProps {
  label: string;
  value: string;
}

// Display-only statistic: loading and empty states are handled by PlayerGrid.
function PlayerStat({ label, value }: PlayerStatProps) {
  return (
    <div className="rounded-lg bg-muted p-3 text-center">
      <p className="text-xl font-black tabular-nums">{value}</p>
      <p className="mt-1 text-xs font-semibold tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

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
          <CardHeader>
            <div className="flex items-center gap-3">
              <Skeleton className="size-16 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
