"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeftRight, Search, Swords, Users } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { PublicEmptyState } from "../../components/public-empty-state";
import type { PlayerDirectoryRow } from "../../lib/data";

interface ComparisonPlayer {
  id: string;
  name: string;
  nameLatin: string | null;
  photoUrl: string | null;
  position: string | null;
  team: {
    id: string;
    name: string;
    slug: string;
    shortCode: string;
    logoUrl: string | null;
    primaryColor: string | null;
  };
  competition: { id: string; name: string; season: string };
  stats: {
    gamesPlayed: number;
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
    fieldGoalPercent: number;
    threePointPercent: number;
    freeThrowPercent: number;
    assistTurnoverRatio: number;
  };
}

interface ComparePlayersClientProps {
  players: PlayerDirectoryRow[];
  initialPlayerIds?: string[];
  className?: string;
}

function playerLabel(player: PlayerDirectoryRow): string {
  return `${player.player_name} · ${player.team_name}`;
}

export function ComparePlayersClient({
  players,
  initialPlayerIds = [],
  className,
}: ComparePlayersClientProps) {
  const initialLeft = players.find(
    (player) => player.player_id === initialPlayerIds[0],
  );
  const initialRight = players.find(
    (player) => player.player_id === initialPlayerIds[1],
  );
  const [selectedIds, setSelectedIds] = useState<[string, string]>([
    initialLeft?.player_id ?? "",
    initialRight?.player_id ?? "",
  ]);
  const [inputValues, setInputValues] = useState<[string, string]>([
    initialLeft ? playerLabel(initialLeft) : "",
    initialRight ? playerLabel(initialRight) : "",
  ]);

  const playersByLabel = useMemo(
    () => new Map(players.map((player) => [playerLabel(player), player])),
    [players],
  );
  const canCompare =
    selectedIds[0].length > 0 &&
    selectedIds[1].length > 0 &&
    selectedIds[0] !== selectedIds[1];

  const comparisonQuery = useQuery<ComparisonPlayer[]>({
    queryKey: ["player-comparison", selectedIds],
    queryFn: async () => {
      const response = await fetch(
        `/api/stats/compare-players?playerIds=${selectedIds.join(",")}`,
      );
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.error ?? "Харьцуулалт ачаалж чадсангүй.");
      return payload as ComparisonPlayer[];
    },
    enabled: canCompare,
  });

  function handlePlayerInput(index: 0 | 1, value: string) {
    const nextInputs: [string, string] = [...inputValues];
    nextInputs[index] = value;
    setInputValues(nextInputs);

    const selectedPlayer = playersByLabel.get(value);
    const nextIds: [string, string] = [...selectedIds];
    nextIds[index] = selectedPlayer?.player_id ?? "";
    setSelectedIds(nextIds);
  }

  function swapPlayers() {
    setSelectedIds([selectedIds[1], selectedIds[0]]);
    setInputValues([inputValues[1], inputValues[0]]);
  }

  return (
    <div className={cn("flex flex-col gap-8", className)}>
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Хоёр тоглогч сонгох</CardTitle>
          <CardDescription>
            Нэр бичиж жагсаалтаас сонгоно. Ижил тоглогчийг хоёр талд сонгох
            боломжгүй.
          </CardDescription>
          <CardAction>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={swapPlayers}
              disabled={!selectedIds[0] && !selectedIds[1]}
              aria-label="Тоглогчдын байрыг солих"
            >
              <ArrowLeftRight aria-hidden="true" />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {([0, 1] as const).map((index) => (
            <div key={index} className="flex flex-col gap-2">
              <label
                htmlFor={`player-${index}`}
                className="text-sm font-semibold"
              >
                {index === 0 ? "Эхний тоглогч" : "Хоёр дахь тоглогч"}
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id={`player-${index}`}
                  list="comparison-player-options"
                  value={inputValues[index]}
                  onChange={(event) =>
                    handlePlayerInput(index, event.target.value)
                  }
                  placeholder="Тоглогчийн нэр"
                  className="pl-9"
                  autoComplete="off"
                />
              </div>
            </div>
          ))}
          <datalist id="comparison-player-options">
            {players.map((player) => (
              <option key={player.player_id} value={playerLabel(player)} />
            ))}
          </datalist>
        </CardContent>
      </Card>

      {!canCompare ? (
        <PublicEmptyState
          icon={Swords}
          title="Хоёр өөр тоглогч сонгоно уу"
          description="Сонголт бүрдмэгц оноо, самбар, дамжуулалт, хамгаалалт болон шидэлтийн харьцуулалт гарна."
        />
      ) : comparisonQuery.isLoading ? (
        <ComparisonSkeleton />
      ) : comparisonQuery.isError ? (
        <PublicEmptyState
          icon={Users}
          title="Харьцуулалт гаргаж чадсангүй"
          description={comparisonQuery.error.message}
        />
      ) : comparisonQuery.data?.length === 2 ? (
        <ComparisonResult players={comparisonQuery.data} />
      ) : null}
    </div>
  );
}

interface ComparisonResultProps {
  players: ComparisonPlayer[];
  className?: string;
}

function ComparisonResult({ players, className }: ComparisonResultProps) {
  const left = players[0];
  const right = players[1];
  if (!left || !right) return null;

  const metrics = [
    { label: "Оноо", left: left.stats.points, right: right.stats.points },
    { label: "Самбар", left: left.stats.rebounds, right: right.stats.rebounds },
    {
      label: "Дамжуулалт",
      left: left.stats.assists,
      right: right.stats.assists,
    },
    {
      label: "Бөмбөг таслалт",
      left: left.stats.steals,
      right: right.stats.steals,
    },
    { label: "Хаалт", left: left.stats.blocks, right: right.stats.blocks },
  ];

  return (
    <section
      aria-labelledby="comparison-result-heading"
      className={cn("flex flex-col gap-6", className)}
    >
      <h2 id="comparison-result-heading" className="sr-only">
        Харьцуулалтын үр дүн
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        <ComparisonPlayerCard player={left} />
        <ComparisonPlayerCard player={right} align="right" />
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Үзүүлэлтийн тулаан</CardTitle>
          <CardDescription>
            Урт шугам тухайн ангилалд давуу байгааг илэрхийлнэ.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {metrics.map((metric) => (
            <ComparisonMetric key={metric.label} {...metric} />
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <ShootingCard player={left} />
        <ShootingCard player={right} />
      </div>
    </section>
  );
}

interface ComparisonPlayerCardProps {
  player: ComparisonPlayer;
  align?: "left" | "right";
  className?: string;
}

function ComparisonPlayerCard({
  player,
  align = "left",
  className,
}: ComparisonPlayerCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden bg-sidebar text-sidebar-foreground shadow-none",
        className,
      )}
    >
      <CardHeader>
        <Badge variant="secondary">{player.competition.season}</Badge>
        <CardAction>
          <span className="text-sm text-sidebar-foreground/60">
            {player.stats.gamesPlayed} тоглолт
          </span>
        </CardAction>
      </CardHeader>
      <CardContent
        className={cn(
          "flex items-end gap-4",
          align === "right" && "flex-row-reverse text-right",
        )}
      >
        <PlayerAvatar
          photoUrl={player.photoUrl}
          name={player.name}
          primaryColor={player.team.primaryColor}
          size="2xl"
        />
        <div className="min-w-0 flex-1 pb-1">
          <Link
            href={`/players/${player.id}`}
            className="font-display text-3xl leading-tight tracking-tight hover:text-warning focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            {player.name}
          </Link>
          <p className="mt-2 flex items-center gap-2 text-sm text-sidebar-foreground/70">
            <TeamLogo
              logoUrl={player.team.logoUrl}
              shortCode={player.team.shortCode}
              primaryColor={player.team.primaryColor}
              size="sm"
            />
            {player.team.name}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface ComparisonMetricProps {
  label: string;
  left: number;
  right: number;
  className?: string;
}

function ComparisonMetric({
  label,
  left,
  right,
  className,
}: ComparisonMetricProps) {
  const maxValue = Math.max(left, right, 1);
  const leftWidth = (left / maxValue) * 100;
  const rightWidth = (right / maxValue) * 100;
  return (
    <div className={cn("grid grid-cols-12 items-center gap-3", className)}>
      <span className="col-span-2 text-right text-lg font-black tabular-nums">
        {left.toFixed(1)}
      </span>
      <svg
        className="col-span-3 h-3 w-full text-primary"
        viewBox="0 0 100 10"
        aria-hidden="true"
      >
        <rect
          x={100 - leftWidth}
          y="1"
          width={leftWidth}
          height="8"
          rx="4"
          fill="currentColor"
        />
      </svg>
      <span className="col-span-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <svg
        className="col-span-3 h-3 w-full text-warning"
        viewBox="0 0 100 10"
        aria-hidden="true"
      >
        <rect
          x="0"
          y="1"
          width={rightWidth}
          height="8"
          rx="4"
          fill="currentColor"
        />
      </svg>
      <span className="col-span-2 text-lg font-black tabular-nums">
        {right.toFixed(1)}
      </span>
    </div>
  );
}

interface ShootingCardProps {
  player: ComparisonPlayer;
  className?: string;
}

function ShootingCard({ player, className }: ShootingCardProps) {
  return (
    <Card className={cn("shadow-none", className)}>
      <CardHeader>
        <CardTitle>{player.name}</CardTitle>
        <CardDescription>Шидэлтийн хувь ба үр ашиг</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ShootingStat label="FG%" value={player.stats.fieldGoalPercent} />
        <ShootingStat label="3P%" value={player.stats.threePointPercent} />
        <ShootingStat label="FT%" value={player.stats.freeThrowPercent} />
        <ShootingStat
          label="AST/TO"
          value={player.stats.assistTurnoverRatio}
          suffix=""
        />
      </CardContent>
    </Card>
  );
}

interface ShootingStatProps {
  label: string;
  value: number;
  suffix?: string;
}

function ShootingStat({ label, value, suffix = "%" }: ShootingStatProps) {
  return (
    <div className="rounded-lg bg-muted p-3 text-center">
      <p className="text-xl font-black tabular-nums">
        {value.toFixed(1)}
        {suffix}
      </p>
      <p className="mt-1 text-xs font-semibold tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

interface ComparisonSkeletonProps {
  className?: string;
}

function ComparisonSkeleton({ className }: ComparisonSkeletonProps) {
  return (
    <div
      className={cn("grid gap-4 md:grid-cols-2", className)}
      aria-hidden="true"
    >
      {[0, 1].map((index) => (
        <Card key={index} className="shadow-none">
          <CardContent className="flex items-end gap-4 pt-6">
            <Skeleton className="size-32 rounded-full" />
            <div className="flex flex-1 flex-col gap-3">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
