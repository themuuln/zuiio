// ─── Status Color Palette ───────────────────────────────────────────
// Single source of truth for all progress-status colors in bay-view.
// Each status has a primary hue and semantic variants for every usage.

/** Primary color name for each status — use for dynamic lookups */
export const STATUS_PRIMARY: Record<string, string> = {
  New: "amber",
  Diagnosing: "blue",
  "In Progress": "indigo",
  "Ready for Pickup": "emerald",
  Completed: "emerald",
  Cancelled: "rose",
};

/** Solid accent — left stripe on bay card */
export const STATUS_ACCENT: Record<string, string> = {
  New: "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.2)]",
  Diagnosing: "bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.2)]",
  "In Progress": "bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.2)]",
  "Ready for Pickup": "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.2)]",
  Completed: "bg-emerald-500/40",
  Cancelled: "bg-rose-400/40",
};

/** Badge (inline pill with border) — used in bay card header */
export const STATUS_BADGE_CLASS: Record<string, string> = {
  New: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
  Diagnosing:
    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25",
  "In Progress":
    "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25",
  "Ready for Pickup":
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  Completed:
    "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25",
  Cancelled:
    "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25",
};

/** Solid dot — small circle indicator (filters, timeline, queue) */
export const STATUS_DOT: Record<string, string> = {
  New: "bg-amber-500",
  Diagnosing: "bg-blue-500",
  "In Progress": "bg-indigo-500",
  "Ready for Pickup": "bg-emerald-500",
  Completed: "bg-emerald-500",
  Cancelled: "bg-rose-400",
};

/** Background tint — subtle fill for cards, column headers */
export const STATUS_BG: Record<string, string> = {
  New: "bg-amber-500/5",
  Diagnosing: "bg-blue-500/5",
  "In Progress": "bg-indigo-500/5",
  "Ready for Pickup": "bg-emerald-500/5",
  Completed: "bg-emerald-500/5",
  Cancelled: "bg-rose-500/5",
};

/** Border accent — column top border, card left stripe ring */
export const STATUS_BORDER: Record<string, string> = {
  New: "border-t-amber-500",
  Diagnosing: "border-t-blue-500",
  "In Progress": "border-t-indigo-500",
  "Ready for Pickup": "border-t-emerald-500",
  Completed: "border-t-emerald-500",
  Cancelled: "border-t-rose-400",
};

/** Filter chip — active state bg */
export const STATUS_FILTER_ACTIVE: Record<string, string> = {
  New: "bg-amber-500/10",
  Diagnosing: "bg-blue-500/10",
  "In Progress": "bg-indigo-500/10",
  "Ready for Pickup": "bg-emerald-500/10",
  Completed: "bg-emerald-500/10",
  Cancelled: "bg-rose-500/10",
};

/** Pill — standalone status pill with bg + text (status-pill.tsx) */
export const STATUS_PILL: Record<string, string> = {
  New: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  Diagnosing:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "In Progress":
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  "Ready for Pickup":
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  Completed:
    "bg-emerald-200 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
  Cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
};

/** Timeline dot — ring-style dot used in status-timeline */
export const STATUS_TIMELINE_DOT: Record<string, string> = {
  New: "bg-amber-500 ring-amber-500/20",
  Diagnosing: "bg-blue-500 ring-blue-500/20",
  "In Progress": "bg-indigo-500 ring-indigo-500/20",
  "Ready for Pickup": "bg-emerald-500 ring-emerald-500/20",
  Completed: "bg-emerald-500 ring-emerald-500/20",
  Cancelled: "bg-rose-400 ring-rose-400/20",
};

/** Timeline text — text color for status labels in timeline */
export const STATUS_TIMELINE_TEXT: Record<string, string> = {
  New: "text-amber-600 dark:text-amber-400",
  Diagnosing: "text-blue-600 dark:text-blue-400",
  "In Progress": "text-indigo-600 dark:text-indigo-400",
  "Ready for Pickup": "text-emerald-600 dark:text-emerald-400",
  Completed: "text-emerald-600 dark:text-emerald-400",
  Cancelled: "text-rose-500 dark:text-rose-400",
};

/** Kanban column wrapper — border-t + bg for column header */
export const STATUS_COLUMN: Record<string, string> = {
  New: "border-t-amber-500 bg-amber-500/5",
  Diagnosing: "border-t-blue-500 bg-blue-500/5",
  "In Progress": "border-t-indigo-500 bg-indigo-500/5",
  "Ready for Pickup": "border-t-emerald-500 bg-emerald-500/5",
  Completed: "border-t-emerald-500 bg-emerald-500/5",
  Cancelled: "border-t-rose-400 bg-rose-400/5",
};

/** Stepper — color class for progress stepper segments */
export const STATUS_STEPPER: Record<string, string> = {
  New: "bg-amber-500",
  Diagnosing: "bg-blue-500",
  "In Progress": "bg-indigo-500",
  "Ready for Pickup": "bg-emerald-500",
  Completed: "bg-emerald-500",
  Cancelled: "bg-rose-400",
};

export const ALL_STATUSES = [
  "New",
  "Diagnosing",
  "In Progress",
  "Ready for Pickup",
  "Completed",
  "Cancelled",
] as const;

export const STATUS_TRANSLATION_KEYS: Record<string, string> = {
  New: "statusNew",
  Diagnosing: "statusDiagnosing",
  "In Progress": "statusInProgress",
  "Ready for Pickup": "statusReadyForPickup",
  Completed: "statusCompleted",
  Cancelled: "statusCancelled",
};
