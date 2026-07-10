import type { ServiceScheduleItem } from "@/lib/queries/use-service-reminders";

export type DueStatus = "overdue" | "due-soon" | "scheduled" | "no-date";

export function getScheduleDueStatus(item: ServiceScheduleItem): DueStatus {
  if (!item.next_due_date) return "no-date";
  const now = new Date();
  const due = new Date(item.next_due_date);
  if (due < now) return "overdue";
  if (due < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000))
    return "due-soon";
  return "scheduled";
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatVehicleLabel(
  vehicle:
    | { make: string; model: string; plate_number: string }
    | null
    | undefined,
): string {
  if (!vehicle) return "—";
  return `${vehicle.make} ${vehicle.model} ${vehicle.plate_number}`;
}

export function formatInterval(
  months: number | null,
  km: number | null,
): string {
  const parts: string[] = [];
  if (months) parts.push(`${months}mo`);
  if (km) parts.push(`${km.toLocaleString()}km`);
  return parts.length > 0 ? parts.join(" / ") : "—";
}

export function parsePositiveInt(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) || n < 0 ? null : n;
}
