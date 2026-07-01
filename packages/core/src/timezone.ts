/**
 * Timezone-aware date formatters for Mongolia (Asia/Ulaanbaatar).
 * Uses date-fns-tz for correct timezone handling.
 */

import { parseISO } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

export const TOLOM_TZ = "Asia/Ulaanbaatar" as const;

/** Format a date in Ulaanbaatar timezone. */
export function formatInUB(
  date: Date | string,
  pattern: string = "dd MMM yyyy, HH:mm",
): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatInTimeZone(d, TOLOM_TZ, pattern);
}

/** Short date: "15 Jul 2025" */
export function formatShortDate(date: Date | string): string {
  return formatInUB(date, "dd MMM yyyy");
}

/** Time only: "14:30" */
export function formatTime(date: Date | string): string {
  return formatInUB(date, "HH:mm");
}

/** Full date-time: "15 Jul 2025, 14:30" */
export function formatFullDateTime(date: Date | string): string {
  return formatInUB(date, "dd MMM yyyy, HH:mm");
}

/** Relative time: "5m ago", "Yesterday", "15 Jul 2025" */
export function formatRelative(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatShortDate(d);
}

/** Convert a date to Ulaanbaatar timezone. */
export function toUBDate(date: Date): Date {
  return toZonedTime(date, TOLOM_TZ);
}

/** Start of day in UB timezone (00:00:00). */
export function getUBDayStart(date: Date = new Date()): Date {
  const ubFormatted = formatInTimeZone(date, TOLOM_TZ, "yyyy-MM-dd'T'00:00:00");
  return new Date(ubFormatted);
}

/** End of day in UB timezone (23:59:59). */
export function getUBDayEnd(date: Date = new Date()): Date {
  const ubFormatted = formatInTimeZone(date, TOLOM_TZ, "yyyy-MM-dd'T'23:59:59");
  return new Date(ubFormatted);
}

/** Format a date range nicely: "15–20 Jul 2025" or "28 Jun – 5 Jul 2025" */
export function formatDateRange(
  from: Date | string,
  to: Date | string,
): string {
  const f = typeof from === "string" ? parseISO(from) : from;
  const t = typeof to === "string" ? parseISO(to) : to;

  const fromFormatted = formatInUB(f, "dd MMM");
  const toFormatted = formatInUB(t, "dd MMM yyyy");

  if (formatInUB(f, "MMM yyyy") === formatInUB(t, "MMM yyyy")) {
    return `${formatInUB(f, "dd")}–${toFormatted}`;
  }
  return `${fromFormatted} – ${toFormatted}`;
}

/** Format with day of week: "15 Jul 2025, Tuesday" */
export function formatWithDayOfWeek(date: Date | string): string {
  return formatInUB(date, "dd MMM yyyy, EEEE");
}
