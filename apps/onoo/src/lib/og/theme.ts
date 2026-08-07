/** Shared colors, font configuration, and stat label mappings for OG images. */

export const colors = {
  /** Dark card background. */
  background: "#0a0a0f",
  /** Card surface background (slightly lighter than background). */
  card: "#12121a",
  /** Primary text color. */
  text: "#fafafa",
  /** Muted/secondary text color. */
  textMuted: "#a1a1aa",
  /** Subtle border/separator color. */
  border: "#27272a",
  /** Accent bar default (blue fallback). */
  accent: "#3b82f6",
} as const;

export type ColorKey = keyof typeof colors;

/** Font family configuration for OG images. */
export const fonts = {
  /** Sans-serif display font. */
  display: "Barlow",
  /** Sans-serif body font. */
  body: "Inter",
} as const;

/** Stat labels in Mongolian for OG stat-card captions. */
export const statLabels = {
  points: "ОНОО",
  assists: "ДАМЖУУЛАЛТ",
  rebounds: "САМБАЛ",
  steals: "ТАСАЛТ",
  blocks: "ХААЛТ",
  fouls: "ФОЛ",
  minutes: "МИН",
  fieldGoals: "ШИДЭЛТ",
  threePoints: "3-ОН",
  freeThrows: "ЧӨЛӨӨТ ШИДЭЛТ",
} as const;

export type StatKey = keyof typeof statLabels;
