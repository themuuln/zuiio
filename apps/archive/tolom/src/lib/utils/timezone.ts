import { parseISO } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

// ── Constants ────────────────────────────────────────────────

/** Primary timezone for TOLOM — used across all date displays */
export const TOLOM_TZ = "Asia/Ulaanbaatar" as const;

// ── Formatting ───────────────────────────────────────────────

/**
 * Format a Date or ISO string in Mongolia time.
 * @example formatInUB(new Date(), "dd MMM yyyy, HH:mm") → "29 May 2026, 14:30"
 */
export function formatInUB(
  date: Date | string,
  pattern: string = "dd MMM yyyy, HH:mm",
): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatInTimeZone(d, TOLOM_TZ, pattern);
}

/**
 * Format as short date: "29 May 2026"
 */
export function formatShortDate(date: Date | string): string {
  return formatInUB(date, "dd MMM yyyy");
}

/**
 * Format as time only: "14:30"
 */
export function formatTime(date: Date | string): string {
  return formatInUB(date, "HH:mm");
}

/**
 * Format as full datetime: "29 May 2026, 14:30"
 */
export function formatFullDateTime(date: Date | string): string {
  return formatInUB(date, "dd MMM yyyy, HH:mm");
}

/**
 * Format as relative time for recent dates.
 * "2 hours ago", "Yesterday", "3 days ago", then falls back to short date.
 */
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

// ── Conversion ───────────────────────────────────────────────

/**
 * Convert a UTC Date to Mongolia time (returns a Date object in UB timezone).
 * Useful when you need to extract UB-local day/month/year.
 */
export function toUBDate(date: Date): Date {
  return toZonedTime(date, TOLOM_TZ);
}

/**
 * Get the start of day in UB timezone (midnight UTC+8).
 * Returns a UTC Date that equals 00:00:00 UB time.
 */
export function getUBDayStart(date: Date = new Date()): Date {
  const ubFormatted = formatInTimeZone(date, TOLOM_TZ, "yyyy-MM-dd'T'00:00:00");
  return new Date(ubFormatted);
}

/**
 * Get the end of day in UB timezone (23:59:59 UTC+8).
 */
export function getUBDayEnd(date: Date = new Date()): Date {
  const ubFormatted = formatInTimeZone(date, TOLOM_TZ, "yyyy-MM-dd'T'23:59:59");
  return new Date(ubFormatted);
}

/**
 * Format a date range for display.
 * Same month: "15–29 May 2026"
 * Different months: "15 Apr – 29 May 2026"
 */
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

/**
 * Format ISO date to Mongolian date with day of week.
 * "29 May 2026, Баасан гариг" (but we keep it in English for consistency)
 * "29 May 2026, Wednesday"
 */
export function formatWithDayOfWeek(date: Date | string): string {
  return formatInUB(date, "dd MMM yyyy, EEEE");
}
