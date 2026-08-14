// ─── Card Status Styles ────────────────────────────────────
// Shared tinted background recipe for status-driven cards.
// Every status gets: bg (tinted card), ring (border accent),
// text (label/icon color). Dark mode via opacity modifiers.

export interface CardStatusStyle {
  /** Tinted card background — the whole card carries meaning */
  bg: string;
  /** Ring/border accent — subtle color boundary */
  ring: string;
  /** Text and icon color for the status label */
  text: string;
  /** Colored dot indicator (bg-* class) */
  dot: string;
  /** Colored left border bar (bg-* class) */
  bar: string;
}

export const CARD_STATUS_STYLES: Record<string, CardStatusStyle> = {
  // ── Estimate statuses ──────────────────────────────────
  draft: {
    bg: "bg-muted/40",
    ring: "ring-border",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground/50",
    bar: "bg-muted-foreground/50",
  },
  sent: {
    bg: "bg-sky-50 dark:bg-sky-950/40",
    ring: "ring-sky-200 dark:ring-sky-800",
    text: "text-sky-600 dark:text-sky-400",
    dot: "bg-sky-500",
    bar: "bg-sky-500",
  },
  approved: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    ring: "ring-emerald-200 dark:ring-emerald-800",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
  },
  declined: {
    bg: "bg-red-50 dark:bg-red-950/40",
    ring: "ring-red-200 dark:ring-red-800",
    text: "text-red-600 dark:text-red-400",
    dot: "bg-red-500",
    bar: "bg-red-500",
  },
  expired: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    ring: "ring-amber-200 dark:ring-amber-800",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
    bar: "bg-amber-500",
  },
  converted: {
    bg: "bg-violet-50 dark:bg-violet-950/40",
    ring: "ring-violet-200 dark:ring-violet-800",
    text: "text-violet-600 dark:text-violet-400",
    dot: "bg-violet-500",
    bar: "bg-violet-500",
  },

  // ── Work order statuses (Title Case to match DB) ───────
  New: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    ring: "ring-blue-200 dark:ring-blue-800",
    text: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
    bar: "bg-blue-500",
  },
  Diagnosing: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    ring: "ring-amber-200 dark:ring-amber-800",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
    bar: "bg-amber-500",
  },
  "In Progress": {
    bg: "bg-orange-50 dark:bg-orange-950/40",
    ring: "ring-orange-200 dark:ring-orange-800",
    text: "text-orange-600 dark:text-orange-400",
    dot: "bg-orange-500",
    bar: "bg-orange-500",
  },
  "Ready for Pickup": {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    ring: "ring-emerald-200 dark:ring-emerald-800",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
  },
  Completed: {
    bg: "bg-muted/40",
    ring: "ring-border",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground/50",
    bar: "bg-muted-foreground/50",
  },
  Cancelled: {
    bg: "bg-red-50 dark:bg-red-950/40",
    ring: "ring-red-200 dark:ring-red-800",
    text: "text-red-600 dark:text-red-400",
    dot: "bg-red-500",
    bar: "bg-red-500",
  },

  // ── Bay view statuses (reuse, avoids duplication) ──────
  empty: {
    bg: "bg-muted/40",
    ring: "ring-border",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground/50",
    bar: "bg-muted-foreground/50",
  },
  "in-progress": {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    ring: "ring-blue-200 dark:ring-blue-800",
    text: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
    bar: "bg-blue-500",
  },
  waiting: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    ring: "ring-amber-200 dark:ring-amber-800",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
    bar: "bg-amber-500",
  },
  "ready-for-pickup": {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    ring: "ring-emerald-200 dark:ring-emerald-800",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
  },
};

/** Fallback for unknown statuses — neutral card */
const FALLBACK: CardStatusStyle = {
  bg: "bg-muted/40",
  ring: "ring-border",
  text: "text-muted-foreground",
  dot: "bg-muted-foreground/50",
  bar: "bg-muted-foreground/50",
};

export function getCardStatusStyle(status: string): CardStatusStyle {
  return CARD_STATUS_STYLES[status] ?? FALLBACK;
}
