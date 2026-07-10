// Types
export type {
  SearchScoringConfig,
  SearchRpcParams,
  SearchRpcResult,
  UseRpcSearchOptions,
} from "./types";

// Defaults
export {
  DEFAULT_SCORING,
  DEFAULT_DEBOUNCE_MS,
  DEFAULT_MIN_QUERY_LENGTH,
  DEFAULT_MAX_QUERY_LENGTH,
  DEFAULT_LIMIT,
  DEFAULT_STALE_TIME,
} from "./defaults";

// Keys
export { searchKeys } from "./keys";

// Hook
export { useRpcSearch } from "./use-rpc-search";
