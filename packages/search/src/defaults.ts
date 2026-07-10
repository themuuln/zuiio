import type { SearchScoringConfig } from "./types";

/**
 * Default scoring weights for product/entity search.
 * These match the SQL scoring formula in the search_products RPC.
 *
 * Text score is split internally:
 *   - 60% trigram similarity (typo tolerance)
 *   - 40% FTS rank (semantic relevance)
 *   - Total text weight × 0.80 (80% of composite score)
 *
 * The remaining 20% is split among field-level bonuses.
 */
export const DEFAULT_SCORING: SearchScoringConfig = {
  text: 0.80,
  skuExact: 0.10,
  barcodePartial: 0.05,
  namePrefix: 0.05,
};

/** Default debounce delay for search queries (ms). */
export const DEFAULT_DEBOUNCE_MS = 300;

/** Default minimum query length before triggering search. */
export const DEFAULT_MIN_QUERY_LENGTH = 2;

/** Default maximum query length (input sanitization). */
export const DEFAULT_MAX_QUERY_LENGTH = 100;

/** Default maximum results per search query. */
export const DEFAULT_LIMIT = 50;

/** Default stale time for search query cache (ms). */
export const DEFAULT_STALE_TIME = 30_000;
