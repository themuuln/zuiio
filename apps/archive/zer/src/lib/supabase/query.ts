/**
 * Zer's Supabase query error capture barrel.
 *
 * Re-exports `withDbCapture` from `@zuiio/capture`.
 * All Supabase query code in Zer should use this wrapper to ensure
 * query errors are never silently swallowed.
 */

export { withDbCapture } from "@zuiio/capture";
