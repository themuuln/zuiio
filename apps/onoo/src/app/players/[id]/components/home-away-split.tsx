import { Home, Plane } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SplitRow {
  label: string;
  gp: number;
  wins: number;
  losses: number;
  winPct: number;
  ppg: number;
  rpg: number;
  apg: number;
  tsPct: number;
}

interface HomeAwaySplitProps {
  home: SplitRow;
  away: SplitRow;
  locale?: "mn" | "en";
  className?: string;
}

function SplitColumn({
  split,
  icon: Icon,
  isEn,
}: {
  split: SplitRow;
  icon: typeof Home;
  isEn: boolean;
}) {
  const rows = [
    {
      label: isEn ? "GP" : "Тоглолт",
      home: split.gp,
      away: 0,
      show: true,
    },
    {
      label: isEn ? "Record" : "Бүртгэл",
      home: `${split.wins}-${split.losses}`,
      away: "",
      show: true,
    },
    {
      label: isEn ? "Win %" : "Ялалт %",
      home: `${(split.winPct * 100).toFixed(0)}%`,
      away: "",
      show: true,
    },
    {
      label: "PPG",
      home: split.ppg.toFixed(1),
      away: "",
      show: true,
    },
    {
      label: "RPG",
      home: split.rpg.toFixed(1),
      away: "",
      show: true,
    },
    {
      label: "APG",
      home: split.apg.toFixed(1),
      away: "",
      show: true,
    },
    {
      label: "TS%",
      home: `${(split.tsPct * 100).toFixed(1)}%`,
      away: "",
      show: true,
    },
  ];

  return (
    <div className="flex-1 space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Icon
          className="size-4 text-[var(--brand-sports)]"
          aria-hidden="true"
        />
        {split.label}
      </div>
      <div className="space-y-1.5">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-muted-foreground">{row.label}</span>
            <span className="font-medium tabular-nums">{row.home}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HomeAwaySplitCard({
  home,
  away,
  locale = "mn",
  className,
}: HomeAwaySplitProps) {
  const isEn = locale === "en";

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--brand-sports)]/10 text-[var(--brand-sports)]">
            <Home className="size-5" aria-hidden="true" />
          </span>
          <div>
            <CardTitle className="text-lg">
              {isEn ? "Home / Away Splits" : "Гэр / Зочин статистик"}
            </CardTitle>
            <CardDescription className="mt-1">
              {isEn ? "Performance by venue" : "Талбай бүрийн гүйцэтгэл"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 sm:gap-8">
          <SplitColumn split={home} icon={Home} isEn={isEn} />
          <div className="w-px bg-border" />
          <SplitColumn split={away} icon={Plane} isEn={isEn} />
        </div>
      </CardContent>
    </Card>
  );
}
