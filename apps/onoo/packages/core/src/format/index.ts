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

// ---------------------------------------------------------------------------
// Event description
// ---------------------------------------------------------------------------

interface EventLike {
  event_type: string;
  payload: unknown;
}

const EVENT_LABELS_MN: Record<string, string> = {
  shot_2pt_made: "2 оноо",
  shot_2pt_missed: "2 оноо алдав",
  shot_3pt_made: "3 оноо",
  shot_3pt_missed: "3 оноо алдав",
  ft_made: "Ширэнгийн оноо",
  ft_missed: "Ширэнгийн оноо алдав",
  rebound_off: "Давсан (хамааралгүй)",
  rebound_def: "Давсан (хамааралтай)",
  rebound_team: "Багийн давсан",
  steal: "Булаасан",
  block: "Хаасан",
  turnover: "Алдаа",
  foul_personal: "Хувийн зөрчил",
  foul_technical: "Техникийн зөрчил",
  substitution: "Солигч",
  timeout: "Түр хугацаа",
  period_start: "Үе эхэллээ",
  period_end: "Үе дууслаа",
  game_start: "Тоглолт эхэллээ",
  game_end: "Тоглолт дууслаа",
};

const EVENT_LABELS_EN: Record<string, string> = {
  shot_2pt_made: "2pt made",
  shot_2pt_missed: "2pt missed",
  shot_3pt_made: "3pt made",
  shot_3pt_missed: "3pt missed",
  ft_made: "FT made",
  ft_missed: "FT missed",
  rebound_off: "Offensive rebound",
  rebound_def: "Defensive rebound",
  rebound_team: "Team rebound",
  steal: "Steal",
  block: "Block",
  turnover: "Turnover",
  foul_personal: "Personal foul",
  foul_technical: "Technical foul",
  substitution: "Substitution",
  timeout: "Timeout",
  period_start: "Period start",
  period_end: "Period end",
  game_start: "Game start",
  game_end: "Game end",
};

/**
 * Describe a stat event as a human-readable string.
 *
 * @param event - The event to describe
 * @param locale - Language for the description
 * @returns A string like "2 оноо" or "3pt made"
 */
export function describeEvent(
  event: EventLike,
  locale: "mn" | "en" = "mn"
): string {
  const labels = locale === "mn" ? EVENT_LABELS_MN : EVENT_LABELS_EN;
  const base = labels[event.event_type] ?? event.event_type;

  // Add context for specific events
  if (event.event_type === "substitution" && event.payload) {
    const p = event.payload as { in_player_id?: string; out_player_id?: string };
    if (p.in_player_id && p.out_player_id) {
      return locale === "mn"
        ? `${p.out_player_id} → ${p.in_player_id}`
        : `${p.out_player_id} → ${p.in_player_id}`;
    }
  }

  if (event.event_type === "foul_personal" && event.payload) {
    const p = event.payload as { foul_type?: string };
    if (p.foul_type) {
      const foulLabel = locale === "mn"
        ? { shooting: "зэвсгийт", non_shooting: "зэвсгийт бус", offensive: "халагч" }
        : { shooting: "shooting", non_shooting: "non-shooting", offensive: "offensive" };
      return `${base} (${foulLabel[p.foul_type as keyof typeof foulLabel] ?? p.foul_type})`;
    }
  }

  return base;
}
