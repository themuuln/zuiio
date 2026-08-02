/**
 * Tests for src/lib/hooks/use-barcode-scanner.ts
 *
 * Simulates wedge-scanner input as window keydown events: a scanner types
 * the code at 15-30ms intervals and terminates with Enter. jsdom + real
 * timers for the fast-scan cases; fake timers for the slow-typing case.
 */

import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useBarcodeScanner } from "../use-barcode-scanner";

/** Dispatch a single keydown to `target` (defaults to window). */
function pressKey(key: string, target: EventTarget | null = window) {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
  });
  if (target === null || target === window) {
    window.dispatchEvent(event);
  } else {
    target.dispatchEvent(event);
  }
}

/** Dispatch a full key sequence (e.g. a barcode, then Enter). */
function pressKeys(keys: string[], target: EventTarget | null = window) {
  for (const key of keys) pressKey(key, target);
}

afterEach(() => {
  vi.useRealTimers();
});

describe("useBarcodeScanner", () => {
  it("fires onScan once with the full code for a fast wedge scan", () => {
    const onScan = vi.fn();
    renderHook(() => useBarcodeScanner({ onScan }));

    pressKeys(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]);
    pressKey("Enter");

    expect(onScan).toHaveBeenCalledTimes(1);
    expect(onScan).toHaveBeenCalledWith("1234567890");
  });

  it("clears the buffer after a scan so consecutive scans stay independent", () => {
    const onScan = vi.fn();
    renderHook(() => useBarcodeScanner({ onScan }));

    pressKeys(["1", "2", "3", "4"]);
    pressKey("Enter");
    pressKeys(["5", "6", "7", "8"]);
    pressKey("Enter");

    expect(onScan).toHaveBeenCalledTimes(2);
    expect(onScan).toHaveBeenNthCalledWith(1, "1234");
    expect(onScan).toHaveBeenNthCalledWith(2, "5678");
  });

  it("does not fire when keys arrive slower than the wedge cadence", () => {
    vi.useFakeTimers();
    const onScan = vi.fn();
    renderHook(() => useBarcodeScanner({ onScan }));

    // Human typing: each key > 80ms apart, so the buffer clears between keys.
    for (const key of ["1", "2", "3", "4", "5", "6", "7", "8"]) {
      pressKey(key);
      act(() => vi.advanceTimersByTime(100));
    }
    pressKey("Enter");

    expect(onScan).not.toHaveBeenCalled();
  });

  it("does not fire on a plain Enter with an empty buffer", () => {
    const onScan = vi.fn();
    renderHook(() => useBarcodeScanner({ onScan }));

    pressKey("Enter");
    pressKey("Enter");

    expect(onScan).not.toHaveBeenCalled();
  });

  it("does not fire for short buffers terminated by Enter", () => {
    const onScan = vi.fn();
    renderHook(() => useBarcodeScanner({ onScan }));

    pressKeys(["1", "2", "3"]);
    pressKey("Enter");

    expect(onScan).not.toHaveBeenCalled();
  });

  it("ignores keystrokes typed into editable fields", () => {
    const onScan = vi.fn();
    renderHook(() => useBarcodeScanner({ onScan }));

    const input = document.createElement("input");
    document.body.appendChild(input);

    pressKeys(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"], input);
    pressKey("Enter", input);

    expect(onScan).not.toHaveBeenCalled();
    input.remove();
  });

  it("does not fire while disabled and resumes when re-enabled", () => {
    const onScan = vi.fn();
    const { rerender } = renderHook(
      ({ enabled }) => useBarcodeScanner({ onScan, enabled }),
      { initialProps: { enabled: false } },
    );

    pressKeys(["1", "2", "3", "4"]);
    pressKey("Enter");
    expect(onScan).not.toHaveBeenCalled();

    rerender({ enabled: true });
    pressKeys(["9", "8", "7", "6"]);
    pressKey("Enter");

    expect(onScan).toHaveBeenCalledTimes(1);
    expect(onScan).toHaveBeenCalledWith("9876");
  });

  it("uses the latest onScan callback without re-binding the listener", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(
      ({ onScan }) => useBarcodeScanner({ onScan }),
      { initialProps: { onScan: first } },
    );

    rerender({ onScan: second });
    pressKeys(["4", "2", "1", "7"]);
    pressKey("Enter");

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledWith("4217");
  });
});
