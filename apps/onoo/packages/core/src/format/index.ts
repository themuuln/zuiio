// Formatters for Onoo

/**
 * Format seconds to mm:ss clock display
 */
export function formatClock(seconds: number): string {
  const mins = Math.floor(Math.abs(seconds) / 60);
  const secs = Math.abs(seconds) % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format a stat value for display
 */
export function formatStat(
  value: number | null | undefined,
  type: "integer" | "decimal" | "percentage" = "integer"
): string {
  if (value === null || value === undefined) return "—";

  switch (type) {
    case "percentage":
      return `${(value * 100).toFixed(1)}%`;
    case "decimal":
      return value.toFixed(1);
    case "integer":
    default:
      return Math.round(value).toString();
  }
}

/**
 * Format a player name for display
 */
export function formatPlayerName(
  nameLatin: string | null,
  canonicalName: string,
  locale: "mn" | "en" = "mn"
): string {
  if (locale === "en" && nameLatin) return nameLatin;
  return canonicalName;
}
