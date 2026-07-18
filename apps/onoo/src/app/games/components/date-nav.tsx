"use client";

import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function shiftDate(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatShort(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("mn-MN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

interface DateNavProps {
  currentDate: string;
  className?: string;
}

export function DateNav({ currentDate, className }: DateNavProps) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ulaanbaatar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const prev = shiftDate(currentDate, -1);
  const next = shiftDate(currentDate, 1);
  const isToday = currentDate === today;

  return (
    <nav
      aria-label="Огноо сонголт"
      className={cn(
        "flex items-center justify-between gap-2 rounded-xl border border-border/50 bg-[var(--surface-2)] px-2 py-1.5",
        className,
      )}
    >
      <Button
        asChild
        variant="ghost"
        size="sm"
        aria-label="Өмнөх өдөр"
        className="gap-1.5"
      >
        <Link href={`/games?date=${prev}`} prefetch={false}>
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Link>
      </Button>

      <div className="flex items-center gap-2.5">
        <span className="text-sm font-semibold tabular-nums">
          {formatShort(currentDate)}
        </span>
        {!isToday && (
          <Button asChild variant="outline" size="xs" className="gap-1">
            <Link href="/games" prefetch={false}>
              <Calendar className="size-3" aria-hidden="true" />
              Өнөөдөр
            </Link>
          </Button>
        )}
      </div>

      <Button
        asChild
        variant="ghost"
        size="sm"
        aria-label="Дараагийн өдөр"
        className="gap-1.5"
      >
        <Link href={`/games?date=${next}`} prefetch={false}>
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      </Button>
    </nav>
  );
}
