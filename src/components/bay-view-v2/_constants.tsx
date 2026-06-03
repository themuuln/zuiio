export const STATUS_ACCENT: Record<string, string> = {
  New: "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.2)]",
  Diagnosing: "bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.2)]",
  "In Progress": "bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.2)]",
  "Ready for Pickup": "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.2)]",
  Completed: "bg-emerald-500/40",
  Cancelled: "bg-rose-400/40",
};

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
