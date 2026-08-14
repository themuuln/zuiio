/** Status colors for KDS display cards */
export const STATUS_COLORS: Record<string, string> = {
  New: "border-t-blue-500 bg-blue-950/20",
  Diagnosing: "border-t-amber-500 bg-amber-950/20",
  "In Progress": "border-t-emerald-500 bg-emerald-950/20",
  "Ready for Pickup": "border-t-violet-500 bg-violet-950/20",
  Completed: "border-t-gray-500 bg-gray-950/20",
  Cancelled: "border-t-red-500 bg-red-950/20",
};

export const STATUS_BADGE_COLORS: Record<string, string> = {
  New: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Diagnosing: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "In Progress": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "Ready for Pickup": "bg-violet-500/20 text-violet-300 border-violet-500/30",
  Completed: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  Cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
};

export const STATUS_DISPLAY_NAMES: Record<string, string> = {
  New: "New",
  Diagnosing: "Diagnosing",
  "In Progress": "In Progress",
  "Ready for Pickup": "Ready",
  Completed: "Completed",
  Cancelled: "Cancelled",
};
