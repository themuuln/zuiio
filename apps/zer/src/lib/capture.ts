/**
 * Zer's error capture barrel.
 *
 * Re-exports everything from `@zuiio/capture` and wires up Sentry as the
 * telemetry handler. All code in Zer should import from here (or from
 * `@zuiio/capture` directly — either works).
 */

export {
  setCaptureHandler,
  capture,
  captureDbError,
  captureRedirectLoop,
  withDbCapture,
} from "@zuiio/capture";
export type { CaptureContext } from "@zuiio/capture";
