export {
  cn,
  formatCurrency,
  formatMNT,
  formatPlateNumber,
  getInitials,
  stableStringify,
} from "@zuiio/core";

// ── Tolom-specific utilities ──────────────────────────────────

/** Returns true when there are multiple branches (used for conditional UI branching) */
export function hasMultipleBranches<T extends unknown[]>(branches: T): boolean {
  return branches.length > 1;
}

/** Set a browser cookie (client-side only) */
export function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 86_400_000).toUTCString();
  document.cookie = `${name}=${value};expires=${expires};path=/`;
}
