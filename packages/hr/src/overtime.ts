import { OT_RATES } from "./constants";
import type { OvertimeEntry } from "./types";

export function calculateOvertimePay(
  entries: OvertimeEntry[],
  hourlyRate: number,
): number {
  let total = 0;
  for (const entry of entries) {
    const multiplier =
      entry.type === "night" ? 1 + OT_RATES.night : OT_RATES[entry.type];
    total += entry.hours * hourlyRate * multiplier;
  }
  return total;
}
