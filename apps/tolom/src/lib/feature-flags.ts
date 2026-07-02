/**
 * Client-side feature flags.
 * Toggle features on/off without code changes.
 */
export const FEATURE_FLAGS = {
  /** Right sidebar (bottom bar with tabs). Deferred — currently off. */
  rightSidebar: false,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;
