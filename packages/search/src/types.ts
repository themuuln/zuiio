/**
 * Scoring configuration for server-side search.
 *
 * Controls the relative weight of each scoring signal in the composite score.
 * All weights should sum to 1.0.
 */
export interface SearchScoringConfig {
  /** Weight for text relevance (trigram similarity + FTS rank). */
  text: number;
  /** Weight for exact SKU match bonus. */
  skuExact: number;
  /** Weight for barcode partial match bonus. */
  barcodePartial: number;
  /** Weight for name prefix match bonus. */
  namePrefix: number;
}

/**
 * RPC search parameters passed to the search_products (or similar) function.
 */
export interface SearchRpcParams {
  /** The search query string. */
  p_query: string;
  /** Maximum number of results to return. */
  p_limit?: number;
}

/**
 * Base type for search results returned by the RPC.
 * Projects extend this with their specific fields.
 */
export interface SearchRpcResult {
  id: string;
  [key: string]: unknown;
}

/**
 * Options for the useRpcSearch hook.
 */
export interface UseRpcSearchOptions<T> {
  /** Supabase client instance. */
  supabase: ReturnType<typeof import("@supabase/supabase-js").createClient>;
  /** RPC function name (e.g., "search_products"). */
  rpcFunction: string;
  /** Map raw RPC result rows to the desired type. */
  mapResult: (row: Record<string, unknown>) => T;
  /** Debounce delay in milliseconds. Default: 300 */
  debounceMs?: number;
  /** Minimum query length before triggering search. Default: 2 */
  minQueryLength?: number;
  /** Maximum query length (input sanitization). Default: 100 */
  maxLength?: number;
  /** Query cache time in ms. Default: 30000 */
  staleTime?: number;
  /** Max results per query. Default: 50 */
  limit?: number;
}
