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

/**
 * Extracts the raw sort value for a schedule column.
 * Dates stay in ISO form so string comparison sorts chronologically.
 */
export function getScheduleSortValue(
  item: ServiceScheduleItem,
  sortKey: string,
): string | number {
  switch (sortKey) {
    case "vehicle":
      return formatVehicleLabel(item.vehicle);
    case "service":
      return item.service_name;
    case "customer": {
      const customer = item.vehicle?.customer;
      return customer
        ? `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim() ||
            customer.phone ||
            ""
        : "";
    }
    case "interval":
      return item.interval_km ?? item.interval_months ?? 0;
    case "last-service":
      return item.last_service_date ?? "";
    case "next-due":
      return item.next_due_date ?? "";
    case "contact":
      return item.contact_status ?? "";
    default:
      return "";
  }
}

/** Raw sort value for a reminder log column (ISO dates sort chronologically). */
export function getLogSortValue(
  log: {
    vehicle: { make: string; model: string; plate_number: string } | null;
    service_name: string;
    reminder_type: string;
    channel: string;
    status: string;
    scheduled_at: string;
    sent_at: string | null;
  },
  sortKey: string,
): string | number {
  switch (sortKey) {
    case "vehicle":
      return formatVehicleLabel(log.vehicle);
    case "service":
      return log.service_name;
    case "type":
      return log.reminder_type;
    case "channel":
      return log.channel;
    case "status":
      return log.status;
    case "scheduled":
      return log.scheduled_at;
    case "sent":
      return log.sent_at ?? "";
    default:
      return "";
  }
}
