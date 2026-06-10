/**
 * Generates a consistent color for a mechanic based on their name or ID.
 * Similar to GitHub's approach - deterministic hash → color palette.
 */

const MECHANIC_COLORS = [
  {
    bg: "bg-rose-100 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
  },
  {
    bg: "bg-orange-100 dark:bg-orange-950/40",
    text: "text-orange-700 dark:text-orange-300",
  },
  {
    bg: "bg-amber-100 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
  },
  {
    bg: "bg-emerald-100 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  {
    bg: "bg-teal-100 dark:bg-teal-950/40",
    text: "text-teal-700 dark:text-teal-300",
  },
  {
    bg: "bg-cyan-100 dark:bg-cyan-950/40",
    text: "text-cyan-700 dark:text-cyan-300",
  },
  {
    bg: "bg-sky-100 dark:bg-sky-950/40",
    text: "text-sky-700 dark:text-sky-300",
  },
  {
    bg: "bg-indigo-100 dark:bg-indigo-950/40",
    text: "text-indigo-700 dark:text-indigo-300",
  },
  {
    bg: "bg-violet-100 dark:bg-violet-950/40",
    text: "text-violet-700 dark:text-violet-300",
  },
  {
    bg: "bg-fuchsia-100 dark:bg-fuchsia-950/40",
    text: "text-fuchsia-700 dark:text-fuchsia-300",
  },
  {
    bg: "bg-pink-100 dark:bg-pink-950/40",
    text: "text-pink-700 dark:text-pink-300",
  },
  {
    bg: "bg-lime-100 dark:bg-lime-950/40",
    text: "text-lime-700 dark:text-lime-300",
  },
] as const;

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getMechanicColor(id: string): (typeof MECHANIC_COLORS)[number] {
  const index = hashCode(id) % MECHANIC_COLORS.length;
  return MECHANIC_COLORS[index];
}

export function getMechanicInitials(name: string | null | undefined): string {
  if (!name || typeof name !== "string") return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return parts[0]?.[0]?.toUpperCase() ?? "?";
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
