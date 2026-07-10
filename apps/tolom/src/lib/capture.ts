/**
 * Tolom's error capture barrel.
 *
 * Re-exports everything from `@zuiio/capture`. All code in Tolom should
 * import from here (or from `@zuiio/capture` directly — either works).
 */

export type { CaptureContext } from "@zuiio/capture";
export {
  capture,
  captureDbError,
  captureRedirectLoop,
  setCaptureHandler,
  withDbCapture,
} from "@zuiio/capture";
