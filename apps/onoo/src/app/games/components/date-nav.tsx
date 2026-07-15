"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

function shiftDate(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatShort(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("mn-MN", {
    month: "short",
    day: "numeric",
  });
}

export function DateNav({ currentDate }: { currentDate: string }) {
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
      className="flex items-center justify-between gap-4"
    >
      <Button asChild variant="outline" size="sm">
        <Link href={`/games?date=${prev}`} prefetch={false}>
          ← Өмнөх
        </Link>
      </Button>

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium tabular-nums">
          {formatShort(currentDate)}
        </span>
        {!isToday && (
          <Button asChild variant="secondary" size="xs">
            <Link href="/games" prefetch={false}>
              Өнөөдөр
            </Link>
          </Button>
        )}
      </div>

      <Button asChild variant="outline" size="sm">
        <Link href={`/games?date=${next}`} prefetch={false}>
          Дараагийн →
        </Link>
      </Button>
    </nav>
  );
}
