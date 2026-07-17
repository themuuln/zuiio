"use client";

import { ArrowRight, Medal, Scale, Trophy } from "lucide-react";
import Link from "next/link";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { PublicEmptyState } from "../../components/public-empty-state";
import type { LeaderRow } from "../../lib/data";

const MINIMUM_GAMES = 5;

interface CategoryConfig {
  key: string;
  label: string;
  shortLabel: string;
  getValue: (leader: LeaderRow) => number;
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: "pts",
    label: "Оноо",
    shortLabel: "ОНОО",
    getValue: (leader) => leader.pts ?? 0,
  },
  {
    key: "reb",
    label: "Самбар",
    shortLabel: "САМБ",
    getValue: (leader) => (leader.oreb ?? 0) + (leader.dreb ?? 0),
  },
  {
    key: "ast",
    label: "Дамжуулалт",
    shortLabel: "ДАМЖ",
    getValue: (leader) => leader.ast ?? 0,
  },
  {
    key: "stl",
    label: "Бөмбөг таслалт",
    shortLabel: "ТАС",
    getValue: (leader) => leader.stl ?? 0,
  },
  {
    key: "blk",
    label: "Хаалт",
    shortLabel: "ХААЛТ",
    getValue: (leader) => leader.blk ?? 0,
  },
];

interface LeaderTabsProps {
  leaders: LeaderRow[];
  className?: string;
}

function rankedLeaders(
  leaders: LeaderRow[],
  category: CategoryConfig,
): LeaderRow[] {
  return [...leaders]
    .sort((a, b) => {
      const qualificationDifference =
        Number(b.gp >= MINIMUM_GAMES) - Number(a.gp >= MINIMUM_GAMES);
      if (qualificationDifference !== 0) return qualificationDifference;
      return category.getValue(b) - category.getValue(a);
    })
    .slice(0, 10);
}

export function LeaderTabs({ leaders, className }: LeaderTabsProps) {
  if (leaders.length === 0) {
    return (
      <PublicEmptyState
        icon={Trophy}
        title="Тэргүүлэгч тодроогүй байна"
        description="Баталгаажсан тоглолтын статистик цуглармагц ангилал бүрийн шилдгүүд энд гарна."
        actionHref="/games"
        actionLabel="Тоглолтууд харах"
        className={className}
      />
    );
  }

  return (
    <Tabs defaultValue="pts" className={cn("flex flex-col gap-6", className)}>
      <div className="overflow-x-auto pb-1">
        <TabsList variant="line">
          {CATEGORIES.map((category) => (
            <TabsTrigger key={category.key} value={category.key}>
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {CATEGORIES.map((category) => {
        const ranked = rankedLeaders(leaders, category);
        const podium = ranked.slice(0, 3);
        const remaining = ranked.slice(3);

        return (
          <TabsContent
            key={category.key}
            value={category.key}
            className="flex flex-col gap-6"
          >
            <div className="grid gap-4 md:grid-cols-3">
              {podium.map((leader, index) => (
                <Link
                  key={`${category.key}-${leader.player_id}-${leader.competition_id}`}
                  href={`/players/${leader.player_id}`}
                  className="group rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Card
                    className={cn(
                      "h-full overflow-hidden shadow-none transition-[box-shadow,transform] group-hover:shadow-md group-active:scale-[0.98] motion-reduce:transition-none",
                      index === 0
                        ? "bg-sidebar text-sidebar-foreground"
                        : "",
                    )}
                  >
                    <CardHeader>
                      <Badge variant={index === 0 ? "secondary" : "outline"}>
                        <Medal data-icon="inline-start" aria-hidden="true" />#
                        {index + 1}
                      </Badge>
                      <CardAction>
                        <span className="stat-number text-3xl">
                          {category.getValue(leader).toFixed(1)}
                        </span>
                      </CardAction>
                    </CardHeader>
                    <CardContent className="flex items-end gap-4">
                      <PlayerAvatar
                        photoUrl={leader.player_photo_url}
                        name={leader.player_name}
                        primaryColor={leader.team_primary_color}
                        size="xl"
                      />
                      <div className="min-w-0 flex-1 pb-1">
                        <CardTitle className="truncate text-xl">
                          {leader.player_name}
                        </CardTitle>
                        <CardDescription
                          className={cn(
                            "mt-2 flex items-center gap-2",
                            index === 0 && "text-sidebar-foreground/70",
                          )}
                        >
                          <TeamLogo
                            logoUrl={leader.team_logo_url}
                            shortCode={leader.team_short_code}
                            primaryColor={leader.team_primary_color}
                            size="sm"
                          />
                          <span className="truncate">{leader.team_name}</span>
                        </CardDescription>
                        <QualificationBadge gamesPlayed={leader.gp} />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {remaining.length > 0 ? (
              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle>4–10 байр</CardTitle>
                  <CardDescription>
                    {category.label} ангиллын дараагийн тоглогчид
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="flex flex-col gap-1">
                    {remaining.map((leader, index) => (
                      <li
                        key={`${category.key}-${leader.player_id}-${leader.competition_id}`}
                      >
                        <div className="grid grid-cols-12 items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent/50">
                          <span className="col-span-1 text-sm font-black tabular-nums text-muted-foreground">
                            {index + 4}
                          </span>
                          <Link
                            href={`/players/${leader.player_id}`}
                            className="col-span-7 flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <PlayerAvatar
                              photoUrl={leader.player_photo_url}
                              name={leader.player_name}
                              primaryColor={leader.team_primary_color}
                            />
                            <span className="min-w-0">
                              <span className="block truncate font-semibold">
                                {leader.player_name}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {leader.team_name} · {leader.gp} тоглолт
                              </span>
                            </span>
                          </Link>
                          <span className="col-span-2 text-right text-xl font-black tabular-nums">
                            {category.getValue(leader).toFixed(1)}
                          </span>
                          <Button
                            asChild
                            variant="ghost"
                            size="icon-sm"
                            className="col-span-2 justify-self-end"
                          >
                            <Link
                              href={`/players/compare?players=${leader.player_id}`}
                              aria-label={`${leader.player_name} тоглогчийг харьцуулах`}
                            >
                              <Scale aria-hidden="true" />
                            </Link>
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            ) : null}

            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-base">Эрэмбийн шаардлага</CardTitle>
                <CardDescription>
                  Нэг удаагийн өндөр үзүүлэлтээр хүснэгтийг тэргүүлэхээс
                  сэргийлж дор хаяж {MINIMUM_GAMES} баталгаажсан тоглолтод
                  оролцсон байна.
                </CardDescription>
                <CardAction>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/players/compare">
                      Тоглогч харьцуулах
                      <ArrowRight data-icon="inline-end" aria-hidden="true" />
                    </Link>
                  </Button>
                </CardAction>
              </CardHeader>
            </Card>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}

interface QualificationBadgeProps {
  gamesPlayed: number;
  className?: string;
}

function QualificationBadge({
  gamesPlayed,
  className,
}: QualificationBadgeProps) {
  const remainingGames = Math.max(MINIMUM_GAMES - gamesPlayed, 0);
  return (
    <Badge
      variant={remainingGames === 0 ? "secondary" : "outline"}
      className={cn("mt-3", className)}
    >
      {remainingGames === 0
        ? "Шалгуур хангасан"
        : `${remainingGames} тоглолт дутуу`}
    </Badge>
  );
}

interface LeaderTabsSkeletonProps {
  className?: string;
}

export function LeaderTabsSkeleton({ className }: LeaderTabsSkeletonProps) {
  const placeholders = ["leader-one", "leader-two", "leader-three"];

  return (
    <div className={cn("grid gap-4 md:grid-cols-3", className)}>
      {placeholders.map((placeholder) => (
        <Card key={placeholder} className="shadow-none" aria-hidden="true">
          <CardHeader>
            <Skeleton className="h-5 w-16" />
          </CardHeader>
          <CardContent className="flex items-end gap-4">
            <Skeleton className="size-24 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
