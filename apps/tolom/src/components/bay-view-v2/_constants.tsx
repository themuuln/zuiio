// ─── Status Color Palette ───────────────────────────────────────────
// Single source of truth. Add/edit a status in the STATUSES array below;
// every export derives from it at module-load time.
//
// Each variant (dot, badge, pill, …) uses a role-based naming helper that
// builds the full Tailwind v4–compatible class string so the JIT picks it up.

type StatusDef = {
  hue: string;
  /** Tailwind weight used for solid fills. Lighter/darker variants derive from it. */
  weight: number;
};

const STATUSES: Record<string, StatusDef> = {
  New: { hue: "amber", weight: 500 },
  Diagnosing: { hue: "blue", weight: 500 },
  "In Progress": { hue: "teal", weight: 500 },
  "Ready for Pickup": { hue: "emerald", weight: 500 },
  Completed: { hue: "emerald", weight: 400 },
  Cancelled: { hue: "rose", weight: 400 },
} as const;

// ── Build helpers ──────────────────────────────────────────
// Each accepts (hue, weight) and returns a complete, static class string
// that Tailwind v4's JIT can scan.

const solidFill = (h: string, w: number) => `bg-${h}-${w}`;
const lightBg = (h: string, w: number) => `bg-${h}-${w}/10`;
const tintBg = (h: string, w: number) => `bg-${h}-${w}/5`;
const borderTop = (h: string, w: number) => `border-t-${h}-${w}`;
const ringDot = (h: string, w: number) => `bg-${h}-${w} ring-${h}-${w}/20`;
const dark100 = (_h: string, w: number) => (w >= 500 ? w + 100 : w + 200);
const light300 = (_h: string, _w: number) => 300;
// Button fill — ensures minimum 500 weight for contrast on button backgrounds
const solidFillBtn = (h: string, w: number) => `bg-${h}-${Math.max(w, 500)}`;

/** Top accent bar — solid bar at top of bay card */
// ── Derived maps (explicit class strings for Tailwind JIT) ──

/** Solid accent — left stripe on bay card */
export const STATUS_ACCENT: Record<string, string> = {};
/** Badge (inline pill with border) */
export const STATUS_BADGE_CLASS: Record<string, string> = {};
/** Solid dot — small circle indicator */
export const STATUS_DOT: Record<string, string> = {};
/** Background tint — subtle fill for cards, column headers */
export const STATUS_BG: Record<string, string> = {};
/** Border accent — column top border */
export const STATUS_BORDER: Record<string, string> = {};
/** Filter chip — active state bg */
export const STATUS_FILTER_ACTIVE: Record<string, string> = {};
/** Pill — standalone status pill */
export const STATUS_PILL: Record<string, string> = {};
/** Timeline dot — ring-style dot */
export const STATUS_TIMELINE_DOT: Record<string, string> = {};
/** Timeline text color */
export const STATUS_TIMELINE_TEXT: Record<string, string> = {};
/** Kanban column wrapper — border-t + bg */
export const STATUS_COLUMN: Record<string, string> = {};
/** Stepper segment color */
export const STATUS_STEPPER: Record<string, string> = {};
/** Primary hue name */
export const STATUS_PRIMARY: Record<string, string> = {};
/** Solid button background — full opacity for action buttons */
export const STATUS_BTN_SOLID: Record<string, string> = {};


for (const [key, def] of Object.entries(STATUSES)) {
  const { hue, weight } = def;
  STATUS_PRIMARY[key] = hue;

  // accent — solid dot with optional glow
  if (key === "Cancelled" || key === "Completed") {
    STATUS_ACCENT[key] = `${solidFill(hue, weight)}/40`;
  } else {
    STATUS_ACCENT[key] = solidFill(hue, weight);
  }

  STATUS_DOT[key] = solidFill(hue, weight);
  STATUS_BG[key] = tintBg(hue, weight);

  // button solid — full opacity, minimum 500 weight for text contrast
  STATUS_BTN_SOLID[key] = solidFillBtn(hue, weight);

  STATUS_BORDER[key] = borderTop(hue, weight);
  STATUS_FILTER_ACTIVE[key] = lightBg(hue, weight);
  STATUS_COLUMN[key] = `${borderTop(hue, weight)} ${tintBg(hue, weight)}`;
  STATUS_STEPPER[key] = solidFill(hue, weight);
  STATUS_TIMELINE_DOT[key] = ringDot(hue, weight);

  // badge: semi-transparent bg + weight+100 text + /25 border
  STATUS_BADGE_CLASS[key] =
    `${lightBg(hue, weight)} text-${hue}-${dark100(hue, weight)} dark:text-${hue}-${light300(hue, weight)} border-${hue}-${weight}/25`;

  // pill: weight 100 bg + 700 text
  STATUS_PILL[key] =
    `bg-${hue}-100 text-${hue}-700 dark:bg-${hue}-900/30 dark:text-${hue}-300`;

  // timeline text: weight+100 / dark weight-100
  STATUS_TIMELINE_TEXT[key] =
    `text-${hue}-${dark100(hue, weight)} dark:text-${hue}-${light300(hue, weight)}`;
}

export const ALL_STATUSES = Object.keys(STATUSES);

export const URGENCY_WARNING = "bg-amber-500";
export const URGENCY_CRITICAL = "bg-rose-500";
export const STATUS_TRANSLATION_KEYS: Record<string, string> = {
  New: "statusNew",
  Diagnosing: "statusDiagnosing",
  "In Progress": "statusInProgress",
  "Ready for Pickup": "statusReadyForPickup",
  Completed: "statusCompleted",
  Cancelled: "statusCancelled",
};

// ── Tailwind v4 safelist ─────────────────────────────────
// The JIT scanner needs to see every class string somewhere in the file.
// All classes below are generated dynamically by the helpers above.
// prettier-ignore
void [
  "bg-amber-500",
  "bg-blue-500",
  "bg-teal-500",
  "bg-emerald-500",
  "bg-emerald-400",
  "bg-rose-400",
  "bg-amber-500/10",
  "bg-blue-500/10",
  "bg-teal-500/10",
  "bg-emerald-500/10",
  "bg-emerald-400/10",
  "bg-rose-400/10",
  "bg-amber-500/5",
  "bg-blue-500/5",
  "bg-teal-500/5",
  "bg-emerald-500/5",
  "bg-emerald-400/5",
  "bg-rose-400/5",
  "border-t-amber-500",
  "border-t-blue-500",
  "border-t-teal-500",
  "border-t-emerald-500",
  "border-t-emerald-400",
  "border-t-rose-400",
  "bg-amber-500/40",
  "bg-blue-500/40",
  "bg-teal-500/40",
  "bg-emerald-500/40",
  "bg-rose-400/40",
  "text-amber-600",
  "text-blue-600",
  "text-teal-600",
  "text-emerald-600",
  "text-emerald-500",
  "text-rose-500",
  "dark:text-amber-300",
  "dark:text-blue-300",
  "dark:text-teal-300",
  "dark:text-emerald-300",
  "dark:text-rose-300",
  "border-amber-500/25",
  "border-blue-500/25",
  "border-teal-500/25",
  "border-emerald-500/25",
  "border-emerald-400/25",
  "border-rose-400/25",
  "bg-amber-100",
  "bg-blue-100",
  "bg-teal-100",
  "bg-emerald-100",
  "bg-emerald-200",
  "bg-rose-100",
  "text-amber-700",
  "text-blue-700",
  "text-teal-700",
  "text-emerald-700",
  "text-emerald-800",
  "text-rose-700",
  "dark:bg-amber-900/30",
  "dark:bg-blue-900/30",
  "dark:bg-teal-900/30",
  "dark:bg-emerald-900/30",
  "dark:bg-emerald-900/50",
  "dark:bg-rose-900/30",
  "ring-amber-500/20",
  "ring-blue-500/20",
  "ring-teal-500/20",
  "ring-emerald-500/20",
  "ring-emerald-400/20",
  "ring-rose-400/20",
];
