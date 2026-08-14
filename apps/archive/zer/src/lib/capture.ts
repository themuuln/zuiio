/**
 * Zer's error capture barrel.
 *
 * Re-exports everything from `@zuiio/capture` and wires up Sentry as the
 * telemetry handler. All code in Zer should import from here (or from
 * `@zuiio/capture` directly — either works).
 */

export type { CaptureContext } from "@zuiio/capture";
export {
  capture,
  captureDbError,
  captureRedirectLoop,
  setCaptureHandler,
  withDbCapture,
} from "@zuiio/capture";
