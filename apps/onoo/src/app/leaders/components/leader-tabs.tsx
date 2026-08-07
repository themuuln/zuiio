"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeftRight,
  ArrowRight,
  GripVertical,
  Medal,
  Scale,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PlayerAvatar } from "@/components/player-avatar";
import { TeamLogo } from "@/components/team-logo";
import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { PublicEmptyState } from "../../components/public-empty-state";
import type { LeaderRow } from "../../lib/shared";
import { DragCompareZone } from "./drag-compare-zone";
import { DraggablePlayerCard } from "./draggable-player-card";

interface CategoryConfig {
  key: string;
  label: string;
  getValue: (leader: LeaderRow) => number;
  isEligible?: (leader: LeaderRow) => boolean;
  sort?: "asc" | "desc";
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
  {
    key: "fg_pct",
    label: "Шидэлт %",
    getValue: (leader) =>
      (leader.fga ?? 0) > 0 ? ((leader.fgm ?? 0) / (leader.fga ?? 0)) * 100 : 0,
    isEligible: (leader) => (leader.fga ?? 0) >= 10,
  },
  {
    key: "two_pt_pct",
    label: "2 оноо %",
    getValue: (leader) => {
      const twoAtt = (leader.fga ?? 0) - (leader.tpa ?? 0);
      const twoMade = (leader.fgm ?? 0) - (leader.tpm ?? 0);
      return twoAtt > 0 ? (twoMade / twoAtt) * 100 : 0;
    },
    isEligible: (leader) => (leader.fga ?? 0) - (leader.tpa ?? 0) >= 10,
  },
  {
    key: "three_pt_pct",
    label: "3 оноо %",
    getValue: (leader) =>
      (leader.tpa ?? 0) > 0 ? ((leader.tpm ?? 0) / (leader.tpa ?? 0)) * 100 : 0,
    isEligible: (leader) => (leader.tpa ?? 0) >= 5,
  },
  {
    key: "ft_pct",
    label: "Чөлөөт %",
    getValue: (leader) =>
      (leader.fta ?? 0) > 0 ? ((leader.ftm ?? 0) / (leader.fta ?? 0)) * 100 : 0,
    isEligible: (leader) => (leader.fta ?? 0) >= 5,
  },
  {
    key: "mpg",
    label: "Тоглосон цаг",
    getValue: (leader) => leader.mpg ?? 0,
  },
  {
    key: "eff",
    label: "EFF",
    getValue: (leader) => {
      const pts = leader.pts ?? 0;
      const reb = (leader.oreb ?? 0) + (leader.dreb ?? 0);
      const ast = leader.ast ?? 0;
      const stl = leader.stl ?? 0;
      const blk = leader.blk ?? 0;
      const fgm = leader.fgm ?? 0;
      const fga = leader.fga ?? 0;
      const ftm = leader.ftm ?? 0;
      const fta = leader.fta ?? 0;
      const tov = leader.tov ?? 0;
      return pts + reb + ast + stl + blk - (fga - fgm) - (fta - ftm) - tov;
    },
  },
  {
    key: "plus_minus",
    label: "+−",
    getValue: (leader) => leader.avg_plus_minus ?? 0,
  },
  {
    key: "fouls_drawn",
    label: "ДА татсан",
    getValue: (leader) => leader.avg_fouls_drawn ?? 0,
  },
  {
    key: "pf",
    label: "Алдаа",
    getValue: (leader) => leader.pf ?? 0,
    sort: "asc",
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
  const eligible = category.isEligible
    ? leaders.filter(category.isEligible)
    : leaders;
  const direction = category.sort === "asc" ? 1 : -1;
  return [...eligible]
    .sort((a, b) => direction * (category.getValue(a) - category.getValue(b)))
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

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
        role="img"
        className="cursor-grab text-muted-foreground/50 hover:text-muted-foreground"
        aria-label="Чирж шилжүүлэх"
      >
        <GripVertical className="size-3" aria-hidden="true" />
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
  const [compareMode, setCompareMode] = useState(false);
  const [comparePlayers, setComparePlayers] = useState<string[]>([]);
  const [isDraggingPlayer, _setIsDraggingPlayer] = useState(false);
  const router = useRouter();

  // Load saved order from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const validKeys = CATEGORIES.map((c) => c.key);
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        // Keep valid saved keys, append any new keys not yet persisted
        const existing = parsed.filter((k) => validKeys.includes(k));
        const newKeys = validKeys.filter((k) => !existing.includes(k));
        setCategoryOrder([...existing, ...newKeys]);
        setActiveTab([...existing, ...newKeys][0]);
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
          <div
            className="overflow-x-auto pb-1"
            role="tablist"
            aria-label="Ангилал сонгох"
          >
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
      {/* Compare mode controls */}
      <div className="flex items-center gap-2">
        <Button
          variant={compareMode ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setCompareMode(!compareMode);
            setComparePlayers([]);
          }}
        >
          <ArrowLeftRight className="mr-2 size-4" />
          {compareMode ? "Цуцлах" : "Харьцуулах"}
        </Button>
        {compareMode && comparePlayers.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {comparePlayers.length}/2 тоглогч сонгогдлоо
          </span>
        )}
        {comparePlayers.length === 2 && (
          <Button
            size="sm"
            onClick={() => {
              router.push(
                `/players/compare?players=${comparePlayers.join(",")}`,
              );
            }}
          >
            Харьцуулах →
          </Button>
        )}
      </div>

      <DragCompareZone players={comparePlayers} isDragging={isDraggingPlayer} />

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
                <DraggablePlayerCard
                  key={`${category.key}-${leader.player_id}-${leader.competition_id}`}
                  playerId={leader.player_id}
                >
                  <Link
                    href={compareMode ? "#" : `/players/${leader.player_id}`}
                    className={cn(
                      "group rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      compareMode && "pointer-events-none",
                    )}
                    onClick={(e) => {
                      if (compareMode) {
                        e.preventDefault();
                        setComparePlayers((prev) => {
                          if (prev.includes(leader.player_id)) {
                            return prev.filter((id) => id !== leader.player_id);
                          }
                          if (prev.length >= 2) return prev;
                          return [...prev, leader.player_id];
                        });
                      }
                    }}
                  >
                    <Card
                      className={cn(
                        "h-full overflow-hidden shadow-none transition-[box-shadow,transform] group-hover:shadow-md group-active:scale-[0.98] motion-reduce:transition-none",
                        index === 0 ? "bg-sidebar text-sidebar-foreground" : "",
                        compareMode && "cursor-pointer",
                        comparePlayers.includes(leader.player_id) &&
                          "ring-2 ring-[var(--brand-sports)]",
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
                </DraggablePlayerCard>
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
                        <DraggablePlayerCard playerId={leader.player_id}>
                          {/* biome-ignore lint/a11y/noStaticElementInteractions: compare-mode row toggle; inner Link is the primary navigation */}
                          {/* biome-ignore lint/a11y/useKeyWithClickEvents: compare toggle is a mouse-first enhancement; row stays keyboard-usable via the Link */}
                          <div
                            className={cn(
                              "grid grid-cols-12 items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent/50",
                              compareMode && "cursor-pointer",
                              comparePlayers.includes(leader.player_id) &&
                                "ring-2 ring-[var(--brand-sports)]",
                            )}
                            onClick={() => {
                              if (compareMode) {
                                setComparePlayers((prev) => {
                                  if (prev.includes(leader.player_id)) {
                                    return prev.filter(
                                      (id) => id !== leader.player_id,
                                    );
                                  }
                                  if (prev.length >= 2) return prev;
                                  return [...prev, leader.player_id];
                                });
                              }
                            }}
                          >
                            <span className="col-span-1 text-sm font-black tabular-nums text-muted-foreground">
                              {index + 4}
                            </span>
                            <Link
                              href={
                                compareMode
                                  ? "#"
                                  : `/players/${leader.player_id}`
                              }
                              className={cn(
                                "col-span-9 sm:col-span-7 flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                compareMode && "pointer-events-none",
                              )}
                              onClick={(e) => {
                                if (compareMode) e.preventDefault();
                              }}
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
                            <Link
                              href={
                                compareMode
                                  ? "#"
                                  : `/players/compare?players=${leader.player_id}`
                              }
                              aria-label={`${leader.player_name} тоглогчийг харьцуулах`}
                              onClick={(e) => {
                                if (compareMode) e.preventDefault();
                              }}
                              className={cn(
                                "inline-flex size-7 shrink-0 items-center justify-center rounded-[min(var(--radius-md),12px)] transition-all outline-none select-none hover:bg-muted hover:text-foreground col-span-2 justify-self-end hidden sm:block",
                              )}
                            >
                              <Scale aria-hidden="true" />
                            </Link>
                          </div>
                        </DraggablePlayerCard>
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
                  сэргийлж багийн тоглолтын тооны дор хаяж 50%-тай тэнцүү тооны
                  тоглолтод оролцсон байна.
                </CardDescription>
                <CardAction>
                  <Link
                    href="/players/compare"
                    className={cn(
                      "inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-[min(var(--radius-md),12px)] border-border bg-background px-2.5 text-[0.8rem] font-medium whitespace-nowrap transition-all outline-none select-none hover:bg-muted hover:text-foreground [&_svg:not([class*='size-'])]:size-3.5",
                    )}
                  >
                    Тоглогч харьцуулах
                    <ArrowRight data-icon="inline-end" aria-hidden="true" />
                  </Link>
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
