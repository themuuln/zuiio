// ── Helpers ──────────────────────────────────────────────────

export function computeNextDueDate(months: number | null): string | null {
  if (!months) return null;
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

export function computeNextDueKm(
  km: number | null,
  odometer: number | null,
): number | null {
  if (!km || !odometer) return null;
  return odometer + km;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatKm(km: number): string {
  return km.toLocaleString("en-US");
}
