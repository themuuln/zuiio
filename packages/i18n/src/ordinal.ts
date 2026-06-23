/**
 * Mongolian ordinal suffix: 1 → "1-р", 2 → "2-р", 11 → "11-р"
 * Used for rankings, page numbers, etc.
 */
export function toMNOrdinal(n: number): string {
  return `${n}-р`;
}

/**
 * "1-р байр", "2-р байр", etc.
 */
export function toMNOrdinalLabel(n: number, noun: string): string {
  return `${n}-р ${noun}`;
}
