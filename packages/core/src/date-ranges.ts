import {
  endOfMonth,
  endOfQuarter,
  endOfYear,
  format,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  subMonths,
  subQuarters,
  subYears,
} from "date-fns";

export interface DateRange {
  from: string;
  to: string;
}

function fmt(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function thisMonth(now = new Date()): DateRange {
  return { from: fmt(startOfMonth(now)), to: fmt(endOfMonth(now)) };
}

export function lastMonth(now = new Date()): DateRange {
  const prev = subMonths(now, 1);
  return { from: fmt(startOfMonth(prev)), to: fmt(endOfMonth(prev)) };
}

export function thisQuarter(now = new Date()): DateRange {
  return { from: fmt(startOfQuarter(now)), to: fmt(endOfQuarter(now)) };
}

export function lastQuarter(now = new Date()): DateRange {
  const prev = subQuarters(now, 1);
  return { from: fmt(startOfQuarter(prev)), to: fmt(endOfQuarter(prev)) };
}

export function thisYear(now = new Date()): DateRange {
  return { from: fmt(startOfYear(now)), to: fmt(endOfYear(now)) };
}

export function lastYear(now = new Date()): DateRange {
  const prev = subYears(now, 1);
  return { from: fmt(startOfYear(prev)), to: fmt(endOfYear(prev)) };
}

export function lastNDays(n: number, now = new Date()): DateRange {
  const from = new Date(now);
  from.setDate(from.getDate() - n + 1);
  return { from: fmt(from), to: fmt(now) };
}
