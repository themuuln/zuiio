"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + days);
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
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const prev = shiftDate(currentDate, -1);
  const next = shiftDate(currentDate, 1);
  const isToday = currentDate === today;

  return (
    <nav
      aria-label="Огноо сонголт"
      className="flex items-center justify-between gap-4"
    >
      <Link
        href={`/games?date=${prev}`}
        className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
        prefetch={false}
      >
        ← Өмнөх
      </Link>

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium tabular-nums">
          {formatShort(currentDate)}
        </span>
        {!isToday && (
          <Link
            href="/games"
            className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            prefetch={false}
          >
            Өнөөдөр
          </Link>
        )}
      </div>

      <Link
        href={`/games?date=${next}`}
        className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
        prefetch={false}
      >
        Дараагийн →
      </Link>
    </nav>
  );
}
