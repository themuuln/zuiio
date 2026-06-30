import { parseISO } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

export const TOLOM_TZ = "Asia/Ulaanbaatar" as const;

export function formatInUB(
  date: Date | string,
  pattern: string = "dd MMM yyyy, HH:mm",
): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatInTimeZone(d, TOLOM_TZ, pattern);
}

export function formatShortDate(date: Date | string): string {
  return formatInUB(date, "dd MMM yyyy");
}

export function formatTime(date: Date | string): string {
  return formatInUB(date, "HH:mm");
}

export function formatFullDateTime(date: Date | string): string {
  return formatInUB(date, "dd MMM yyyy, HH:mm");
}

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

export function toUBDate(date: Date): Date {
  return toZonedTime(date, TOLOM_TZ);
}

export function getUBDayStart(date: Date = new Date()): Date {
  const ubFormatted = formatInTimeZone(date, TOLOM_TZ, "yyyy-MM-dd'T'00:00:00");
  return new Date(ubFormatted);
}

export function getUBDayEnd(date: Date = new Date()): Date {
  const ubFormatted = formatInTimeZone(date, TOLOM_TZ, "yyyy-MM-dd'T'23:59:59");
  return new Date(ubFormatted);
}

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

export function formatWithDayOfWeek(date: Date | string): string {
  return formatInUB(date, "dd MMM yyyy, EEEE");
}
