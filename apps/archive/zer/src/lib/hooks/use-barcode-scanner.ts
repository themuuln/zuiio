import { useEffect, useRef } from "react";

/**
 * Barcode scanner wedge (USB/HID keyboard-emulation) support.
 *
 * A scanner wedge types a full code into the focused element at 15-30ms
 * intervals, then sends Enter. This hook listens on `window` for keydown
 * events, accumulates printable characters into a buffer, and treats Enter
 * as the terminator:
 *
 * - buffer length >= 4  → `onScan(code)` fires and the buffer clears;
 * - otherwise           → plain Enter, buffer clears, nothing fires.
 *
 * The buffer auto-clears after `SCAN_INACTIVITY_MS` of silence between
 * keys, so a human typing (slower, interspersed with non-printable keys)
 * never accumulates enough to trigger a scan.
 *
 * Keystrokes targeted at editable elements (input/select/textarea or
 * contenteditable) are ignored, so normal keyboard entry in forms never
 * triggers scans.
 *
 * Callback-only API: mount with `useBarcodeScanner({ onScan, enabled })`,
 * returns nothing. `enabled` (default true) detaches the listener while
 * false — use it to pause wedge scanning while another scan source (e.g.
 * the camera scanner overlay) is active.
 */
const MIN_SCAN_LENGTH = 4;
const SCAN_INACTIVITY_MS = 80;

export type BarcodeScannerOptions = {
  onScan: (code: string) => void;
  /** When false the window keydown listener is not attached. */
  enabled?: boolean;
};

export function useBarcodeScanner({
  onScan,
  enabled = true,
}: BarcodeScannerOptions) {
  const bufferRef = useRef("");
  const timerRef = useRef<number | null>(null);
  const onScanRef = useRef(onScan);

  // Keep the latest callback without re-binding the window listener.
  useEffect(() => {
    onScanRef.current = onScan;
  });

  useEffect(() => {
    if (!enabled) return;

    const clearBuffer = () => {
      bufferRef.current = "";
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore keystrokes typed into editable fields — normal form entry
      // must never be interpreted as a scan.
      const target = event.target;
      if (target instanceof HTMLElement) {
        if (
          target.tagName === "INPUT" ||
          target.tagName === "SELECT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }
      }

      // Skip shortcuts (e.g. Cmd/Ctrl+C/V) — only raw printable input counts.
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      if (event.key === "Enter") {
        const code = bufferRef.current;
        clearBuffer();
        if (code.length >= MIN_SCAN_LENGTH) {
          // Consume the scanner's trailing Enter so it doesn't also click
          // whatever button happens to be focused.
          event.preventDefault();
          onScanRef.current(code);
        }
        return;
      }

      if (event.key.length === 1) {
        bufferRef.current += event.key;
        if (timerRef.current !== null) {
          window.clearTimeout(timerRef.current);
        }
        timerRef.current = window.setTimeout(clearBuffer, SCAN_INACTIVITY_MS);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearBuffer();
    };
  }, [enabled]);
}
