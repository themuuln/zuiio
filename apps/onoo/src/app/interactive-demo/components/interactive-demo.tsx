"use client";

import { useState } from "react";
import { SwipeableCard } from "@/app/components/swipeable-card";
import { SortableTabs } from "@/app/leaders/components/sortable-tabs";
import {
  CourtHeatmap,
  DEFAULT_SHOT_ZONES,
  type ShotZone,
} from "@/app/players/[id]/components/court-heatmap";
import { LiveCourt } from "@/app/players/[id]/components/live-court";
import { SeasonArc } from "@/app/players/[id]/components/season-arc";
import { SkillRadar } from "@/app/players/[id]/components/skill-radar";
import { StatFlipCard } from "@/app/players/[id]/components/stat-flip-card";
import { StandingsTable } from "@/app/standings/components/standings-table";
import { ScoreFlip } from "@/components/score-flip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_CATEGORIES = [
  { key: "pts", label: "Оноо" },
  { key: "reb", label: "Буулт" },
  { key: "ast", label: "Дамжуулалт" },
  { key: "stl", label: "Булчих" },
  { key: "blk", label: "Хамгаалалт" },
];

const MOCK_SHOT_ZONES: ShotZone[] = DEFAULT_SHOT_ZONES.map(
  (zone: ShotZone) => ({
    ...zone,
    made: Math.floor(Math.random() * 40) + 5,
    attempted: Math.floor(Math.random() * 60) + 20,
  }),
);

const MOCK_TEAMS = [
  {
    name: "Арслангууд",
    slug: "arslan",
    shortCode: "ARS",
    primaryColor: "#e63946",
    streak: "W3",
    last10: "8-2",
    homeRecord: "6-1",
    awayRecord: "4-1",
  },
  {
    name: "Барсууд",
    slug: "bars",
    shortCode: "BAR",
    primaryColor: "#457b9d",
    streak: "L1",
    last10: "6-4",
    homeRecord: "5-2",
    awayRecord: "1-2",
  },
  {
    name: "Хулангууд",
    slug: "hulan",
    shortCode: "HUL",
    primaryColor: "#2a9d8f",
    streak: "W2",
    last10: "7-3",
    homeRecord: "4-2",
    awayRecord: "3-1",
  },
  {
    name: "Шонхорууд",
    slug: "shonhor",
    shortCode: "SHO",
    primaryColor: "#e9c46a",
    streak: "L2",
    last10: "5-5",
    homeRecord: "3-3",
    awayRecord: "2-2",
  },
  {
    name: "Могойчууд",
    slug: "mogoi",
    shortCode: "MOG",
    primaryColor: "#264653",
    streak: "W1",
    last10: "6-4",
    homeRecord: "4-2",
    awayRecord: "2-2",
  },
  {
    name: "Бүргэдүүд",
    slug: "burged",
    shortCode: "BUR",
    primaryColor: "#f4a261",
    streak: "L3",
    last10: "4-6",
    homeRecord: "2-4",
    awayRecord: "2-2",
  },
] as const;

const MOCK_STANDINGS = MOCK_TEAMS.map((team, i) => ({
  team_season_id: `ts-${i}`,
  team_name: team.name,
  team_slug: team.slug,
  team_logo_url: null,
  team_short_code: team.shortCode,
  team_primary_color: team.primaryColor,
  w: 10 - i,
  l: i + 2,
  win_pct: (10 - i) / (12 + i * 0.3),
  gb: i === 0 ? null : `${i}.0`,
  streak: team.streak,
  last10: team.last10,
  points_for: 850 + i * 30,
  points_against: 780 + i * 45,
  home_record: team.homeRecord,
  away_record: team.awayRecord,
}));

const MOCK_OPPONENTS = ["ARS", "BAR", "HUL", "SHO", "MOG", "BUR"] as const;

const MOCK_SEASON_DATA = Array.from({ length: 15 }, (_, i) => ({
  game_id: `game-${i}`,
  game_date: `2026-01-${String(i + 1).padStart(2, "0")}`,
  opponent: MOCK_OPPONENTS[i % MOCK_OPPONENTS.length] ?? "ARS",
  pts: Math.floor(Math.random() * 20) + 10,
  reb: Math.floor(Math.random() * 10) + 2,
  ast: Math.floor(Math.random() * 8) + 1,
  result: (Math.random() > 0.4 ? "W" : "L") as "W" | "L",
}));

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InteractiveDemo() {
  const [score, setScore] = useState(0);
  const [sortableItems, setSortableItems] = useState(MOCK_CATEGORIES);
  const [sortableActive, setSortableActive] = useState("pts");

  return (
    <div className="space-y-12">
      {/* 1. Score Flip */}
      <DemoSection
        title="1. Score Flip Animation"
        description="Flip-clock тооны анимейшн. Тоо өөрчлөгдөхөд цифрүүд ээлжлэн эргэнэ."
      >
        <div className="flex items-center gap-6">
          <ScoreFlip
            value={score}
            digits={3}
            className="text-4xl text-foreground"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setScore((s) => Math.max(0, s - 7))}
              className="rounded-lg bg-muted px-3 py-2 text-sm font-medium hover:bg-muted/80"
            >
              -7
            </button>
            <button
              type="button"
              onClick={() => setScore((s) => s + 3)}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              +3
            </button>
            <button
              type="button"
              onClick={() => setScore((s) => s + 2)}
              className="rounded-lg bg-warning px-3 py-2 text-sm font-medium text-warning-foreground hover:bg-warning/90"
            >
              +2
            </button>
          </div>
        </div>
      </DemoSection>

      {/* 2. Skill Radar with toggle */}
      <DemoSection
        title="2. Skill Radar + League Overlay Toggle"
        description="Чадварын зураглал — лигийн дундажийг нуух/харуулах товч."
      >
        <div className="flex justify-center">
          <SkillRadar
            playerStats={{ pts: 22.5, reb: 8.3, ast: 5.1, stl: 1.8, blk: 0.9 }}
            leagueAverages={{
              pts: 12.0,
              reb: 5.5,
              ast: 3.2,
              stl: 1.0,
              blk: 0.5,
            }}
            leagueMaxes={{ pts: 30, reb: 14, ast: 10, stl: 3, blk: 2 }}
          />
        </div>
      </DemoSection>

      {/* 3. Season Arc with Brush */}
      <DemoSection
        title="3. Season Arc + Brush"
        description="Улирлын хэмнэл — доод шугамыг чирч хугацаа сонгоно."
      >
        <SeasonArc data={MOCK_SEASON_DATA} />
      </DemoSection>

      {/* 4. Card Flip Stats */}
      <DemoSection
        title="4. Card Flip Stats"
        description="3D карт эргэлт — улирлын стат → карьерийн стат. Дарж эргүүлнэ."
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatFlipCard value={22.5} backValue={18.3} label="ОНОО" />
          <StatFlipCard value={8.3} backValue={6.7} label="БУУЛТ" />
          <StatFlipCard value={5.1} backValue={4.2} label="ДАМЖУУЛАЛТ" />
          <StatFlipCard
            value={1.8}
            backValue={1.4}
            label="БУЛЧИХ"
            backLabel="Карьер"
          />
        </div>
      </DemoSection>

      {/* 5. Standings Expansion */}
      <DemoSection
        title="5. Standings Row Expansion"
        description="Мөр дээр дарж дэлгэрэнгүй мэдээлэл харуулна."
      >
        <Card className="shadow-none">
          <CardContent className="p-0">
            <StandingsTable rows={MOCK_STANDINGS} />
          </CardContent>
        </Card>
      </DemoSection>

      {/* 6. Swipeable Cards */}
      <DemoSection
        title="6. Swipeable Game Cards"
        description="Зүүн/баруун свайп — мобайл touch ашиглан тоглолт солино."
      >
        <div className="space-y-3">
          {["Арслангууд vs Барсууд", "Хулангууд vs Шонхорууд"].map((title) => (
            <SwipeableCard
              key={title}
              onSwipeLeft={() => alert(`Зүүн свайп: ${title}`)}
              onSwipeRight={() => alert(`Баруун свайп: ${title}`)}
              leftAction={<Badge variant="secondary">← Өмнөх</Badge>}
              rightAction={<Badge variant="secondary">Дараагийн →</Badge>}
            >
              <Card className="shadow-none">
                <CardContent className="p-4">
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-muted-foreground">
                    Свайп хийнэ үү ← →
                  </p>
                </CardContent>
              </Card>
            </SwipeableCard>
          ))}
        </div>
      </DemoSection>

      {/* 7. Sortable Tabs */}
      <DemoSection
        title="7. Sortable Leader Tabs"
        description="Табын эрэмбийг чирч өөрчилнө. localStorage-д хадгална."
      >
        <Card className="shadow-none">
          <CardContent className="p-4">
            <SortableTabs
              items={sortableItems}
              activeKey={sortableActive}
              onSelect={setSortableActive}
              onReorder={setSortableItems}
            />
            <p className="mt-4 text-sm text-muted-foreground">
              Идэвхтэй: <strong>{sortableActive}</strong> — Grip дүрсийг чирч
              эрэмбэлнэ.
            </p>
          </CardContent>
        </Card>
      </DemoSection>

      {/* 8. Court Heatmap */}
      <DemoSection
        title="8. Court Heatmap"
        description="SVG хагас талбай — шидэлтийн бүсүүдийг FG% өнгөөр харуулна."
      >
        <div className="mx-auto max-w-md">
          <CourtHeatmap zones={MOCK_SHOT_ZONES} />
        </div>
      </DemoSection>

      {/* 9. Live Court Animation */}
      <DemoSection
        title="9. Live Court Animation"
        description="Амьд тоглолтын пульс анимейшн + сүүлчийн шидэлтийн RIPPLE."
      >
        <div className="mx-auto max-w-md">
          <LiveCourt isLive={true} lastShot={{ x: 0.5, y: 0.2, made: true }} />
        </div>
      </DemoSection>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function DemoSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="rounded-xl border bg-card p-6">{children}</div>
    </section>
  );
}
