const internalDemoValues = new Set(["1", "true", "yes"]);

/**
 * Keeps deferred consumer/mobile surfaces out of the contracted V2 pilot.
 * Only an explicit server-side environment value can reveal internal demos.
 */
export function isInternalDemo(): boolean {
  return internalDemoValues.has((process.env.ONOO_INTERNAL_DEMO ?? "").toLowerCase());
}
