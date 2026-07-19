"use client";

import { ArrowRight, GripVertical, Medal, Scale, Trophy } from "lucide-react";
import Link from "next/link";
import { PlayerAvatar } from "@/components/player-avatar";
import { TeamLogo } from "@/components/team-logo";
import { Badge } from "@zuiio/ui";
import { Button } from "@zuiio/ui";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zuiio/ui";
import { Skeleton } from "@zuiio/ui";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { PublicEmptyState } from "../../components/public-empty-state";
import type { LeaderRow } from "../../lib/shared";

interface CategoryConfig {
  key: string;
  label: string;
  getValue: (leader: LeaderRow) => number;
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: "pts",
    label: "Оноо",
    getValue: (leader) => leader.pts ?? 0,
  },
  {
    key: "reb",
    label: "Самбар",
    getValue: (leader) => (leader.oreb ?? 0) + (leader.dreb ?? 0),
  },
  {
    key: "ast",
    label: "Дамжуулалт",
    getValue: (leader) => leader.ast ?? 0,
  },
  {
    key: "stl",
    label: "Бөмбөг таслалт",
    getValue: (leader) => leader.stl ?? 0,
  },
  {
    key: "blk",
    label: "Хаалт",
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
  return leaders
    .sort((a, b) => category.getValue(b) - category.getValue(a))
    .slice(0, 10);
}

const STORAGE_KEY = "onoo-leader-order";

function SortableTabTrigger({
  id,
  label,
  isActive,
  onClick,
}: {
  id: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 text-sm font-medium transition-colors",
        "border-b-2 border-transparent text-muted-foreground hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isActive && "border-[var(--brand-sports)] text-foreground",
      )}
      {...attributes}
    >
      <span
        {...listeners}
        className="cursor-grab text-muted-foreground/50 hover:text-muted-foreground"
        aria-label="Чирж шилжүүлэх"
      >
        <GripVertical className="size-3" />
      </span>
      {label}
    </button>
  );
}

export function LeaderTabs({ leaders, className }: LeaderTabsProps) {
  const qualified = leaders.filter((l) => l.qualified);
  const unqualified = leaders.filter((l) => !l.qualified);

  // Category order with localStorage persistence
  const [categoryOrder, setCategoryOrder] = useState<string[]>(() =>
    CATEGORIES.map((c) => c.key),
  );
  const [activeTab, setActiveTab] = useState(categoryOrder[0]);

  // Load saved order from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        // Validate: all keys must exist in CATEGORIES
        const validKeys = CATEGORIES.map((c) => c.key);
        if (parsed.every((k) => validKeys.includes(k))) {
          setCategoryOrder(parsed);
          setActiveTab(parsed[0]);
        }
      }
    } catch {
      // Ignore invalid data
    }
  }, []);

  // Save order to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categoryOrder));
  }, [categoryOrder]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCategoryOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  // Get ordered categories
  const orderedCategories = categoryOrder
    .map((key) => CATEGORIES.find((c) => c.key === key))
    .filter(Boolean) as CategoryConfig[];

  if (qualified.length === 0) {
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
    <div className={cn("flex flex-col gap-6", className)}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={categoryOrder}
          strategy={horizontalListSortingStrategy}
        >
          <div className="overflow-x-auto pb-1" role="tablist" aria-label="Ангилал сонгох">
            {orderedCategories.map((category) => (
              <SortableTabTrigger
                key={category.key}
                id={category.key}
                label={category.label}
                isActive={activeTab === category.key}
                onClick={() => setActiveTab(category.key)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Tab content */}
      {orderedCategories.map((category) => {
        if (category.key !== activeTab) return null;
        const ranked = rankedLeaders(qualified, category);
        const podium = ranked.slice(0, 3);
        const remaining = ranked.slice(3);

        return (
          <div key={category.key} className="flex flex-col gap-6">
            {/* Podium */}
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
                      index === 0 ? "bg-sidebar text-sidebar-foreground" : "",
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
                    <CardContent className="flex flex-col items-center gap-3 sm:flex-row sm:items-end sm:gap-4">
                      <PlayerAvatar
                        photoUrl={leader.player_photo_url}
                        name={leader.player_name}
                        primaryColor={leader.team_primary_color}
                        size="xl"
                      />
                      <div className="min-w-0 flex-1 pb-1">
                        <CardTitle className="truncate text-lg sm:text-xl">
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
                        <QualificationBadge
                          qualified={leader.qualified}
                          teamGamesPlayed={leader.team_games_played}
                          gamesPlayed={leader.gp}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Remaining list */}
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
                            className="col-span-9 sm:col-span-7 flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                          <span className="col-span-2 sm:col-span-2 text-right text-base sm:text-xl font-black tabular-nums">
                            {category.getValue(leader).toFixed(1)}
                          </span>
                          <Button
                            asChild
                            variant="ghost"
                            size="icon-sm"
                            className="col-span-2 justify-self-end hidden sm:block"
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
                <CardTitle className="text-base">
                  Эрэмбийн шаардлага
                </CardTitle>
                <CardDescription>
                  Нэг удаагийн өндөр үзүүлэлтээр хүснэгтийг тэргүүлэхээс
                  сэргийлж багийн тоглолтын тооны дор хаяж 50%-тай тэнцүү
                  тооны тоглолтод оролцсон байна.
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
          </div>
        );
      })}

      {unqualified.length > 0 && (
        <details className="group rounded-xl border bg-muted/30">
          <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50">
            <span className="transition-transform group-open:rotate-90">▶</span>
            Шалгуур хангаагүй ({unqualified.length})
          </summary>
          <div className="border-t px-4 pb-4 pt-3">
            <ol className="flex flex-col gap-1">
              {unqualified.map((player) => {
                const required = Math.max(
                  3,
                  Math.ceil(0.5 * player.team_games_played),
                );
                const short = Math.max(required - player.gp, 0);
                return (
                  <li key={`unq-${player.player_id}-${player.competition_id}`}>
                    <div className="grid grid-cols-12 items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent/50">
                      <div className="col-span-8 flex min-w-0 items-center gap-3">
                        <PlayerAvatar
                          photoUrl={player.player_photo_url}
                          name={player.player_name}
                          primaryColor={player.team_primary_color}
                        />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">
                            {player.player_name}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {player.team_name} · {player.gp} тоглолт
                          </span>
                        </span>
                      </div>
                      <span className="col-span-3 text-right text-sm text-muted-foreground">
                        {short} тоглолт дутуу
                      </span>
                      <div className="col-span-1" />
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </details>
      )}
    </div>
  );
}

interface QualificationBadgeProps {
  qualified: boolean;
  teamGamesPlayed: number;
  gamesPlayed: number;
  className?: string;
}

function QualificationBadge({
  qualified,
  teamGamesPlayed,
  gamesPlayed,
  className,
}: QualificationBadgeProps) {
  if (qualified) {
    return (
      <Badge variant="secondary" className={cn("mt-3", className)}>
        Шалгуур хангасан
      </Badge>
    );
  }
  const required = Math.max(3, Math.ceil(0.5 * teamGamesPlayed));
  const short = Math.max(required - gamesPlayed, 0);
  return (
    <Badge variant="outline" className={cn("mt-3", className)}>
      {short} тоглолт дутуу
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
