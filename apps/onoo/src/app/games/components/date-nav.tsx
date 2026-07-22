"use client";

import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatDateULAT, shiftDate } from "../../lib/shared";

// Deterministic Mongolian short date formatter — avoids hydration mismatch
// caused by Node.js servers missing mn-MN ICU locale data when using
// toLocaleDateString("mn-MN", …).
const WEEKDAYS_SHORT = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"] as const;
const MONTHS_GENITIVE = [
  "1-р сарын",
  "2-р сарын",
  "3-р сарын",
  "4-р сарын",
  "5-р сарын",
  "6-р сарын",
  "7-р сарын",
  "8-р сарын",
  "9-р сарын",
  "10-р сарын",
  "11-р сарын",
  "12-р сарын",
] as const;

function formatShort(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  const wd = WEEKDAYS_SHORT[d.getUTCDay()];
  const mo = MONTHS_GENITIVE[d.getUTCMonth()];
  const day = d.getUTCDate();
  return `${mo} ${day}. ${wd}`;
}

interface DateNavProps {
  currentDate: string;
  className?: string;
}

export function DateNav({ currentDate, className }: DateNavProps) {
  const today = formatDateULAT(new Date());
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
