/**
 * Tolom's Supabase query error capture barrel.
 *
 * Re-exports `withDbCapture` from `@zuiio/capture`.
 * Wrap Supabase queries with this to ensure errors are never silently swallowed.
 */

export { withDbCapture } from "@zuiio/capture";
