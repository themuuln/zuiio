/**
 * Tolom's error capture barrel.
 *
 * Re-exports everything from `@zuiio/capture`. All code in Tolom should
 * import from here (or from `@zuiio/capture` directly — either works).
 */

export {
  setCaptureHandler,
  capture,
  captureDbError,
  captureRedirectLoop,
  withDbCapture,
} from "@zuiio/capture";
export type { CaptureContext } from "@zuiio/capture";
