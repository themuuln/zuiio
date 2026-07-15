import type { RoundingConfig } from "./types";

/**
 * Ceil-to-step rounding: never rounds down, so the min-margin floor
 * can't be violated by rounding.
 */
export function roundPrice(raw: number, config: RoundingConfig): number {
  if (config.step <= 0) {
    throw new Error(`Invalid rounding step: ${config.step}`);
  }
  return Math.ceil(raw / config.step) * config.step;
}
