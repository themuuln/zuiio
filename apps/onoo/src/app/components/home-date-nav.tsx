"use client";

import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatDateULAT, shiftDate } from "../lib/shared";

function formatShort(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("mn-MN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

interface HomeDateNavProps {
  currentDate: string;
  className?: string;
}

/**
 * Date navigation for the homepage.
 * Links to `/?date=<YYYY-MM-DD>` for prev/next day navigation.
 */
export function HomeDateNav({ currentDate, className }: HomeDateNavProps) {
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
        variant="ghost"
        size="sm"
        aria-label="Өмнөх өдөр"
        className="gap-1.5"
      >
        <Link href={`/?date=${prev}`} prefetch={false}>
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Link>
      </Button>

      <div className="flex items-center gap-2.5">
        <span className="text-sm font-semibold tabular-nums">
          {formatShort(currentDate)}
        </span>
        {!isToday && (
          <Button variant="outline" size="xs" className="gap-1">
            <Link href="/" prefetch={false}>
              <Calendar className="size-3" aria-hidden="true" />
              Өнөөдөр
            </Link>
          </Button>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        aria-label="Дараагийн өдөр"
        className="gap-1.5"
      >
        <Link href={`/?date=${next}`} prefetch={false}>
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      </Button>
    </nav>
  );
}
