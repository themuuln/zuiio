/**
 * Tests for useDrawerCloseConfirm hook.
 *
 * Tests the callback that prevents drawer close when there are unsaved changes.
 */
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDrawerCloseConfirm } from "../use-drawer-close-confirm";

describe("useDrawerCloseConfirm", () => {
  it("returns a function", () => {
    const { result } = renderHook(() =>
      useDrawerCloseConfirm(false, vi.fn(), vi.fn()),
    );
    expect(typeof result.current).toBe("function");
  });

  it("calls onClose when no unsaved changes and opening", () => {
    const onClose = vi.fn();
    const { result } = renderHook(() =>
      useDrawerCloseConfirm(false, vi.fn(), onClose),
    );

    result.current(true, undefined);
    expect(onClose).toHaveBeenCalledWith(true);
  });

  it("calls onClose when no unsaved changes and closing", () => {
    const onClose = vi.fn();
    const { result } = renderHook(() =>
      useDrawerCloseConfirm(false, vi.fn(), onClose),
    );

    result.current(false, undefined);
    expect(onClose).toHaveBeenCalledWith(false);
  });

  it("calls onClose when hasUnsavedChanges but opening", () => {
    const onClose = vi.fn();
    const { result } = renderHook(() =>
      useDrawerCloseConfirm(true, vi.fn(), onClose),
    );

    result.current(true, undefined);
    expect(onClose).toHaveBeenCalledWith(true);
  });

  it("cancels close and fires confirm when hasUnsavedChanges and closing with event", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const cancel = vi.fn();
    const eventDetails = { cancel };

    const { result } = renderHook(() =>
      useDrawerCloseConfirm(true, onConfirm, onClose),
    );

    result.current(false, eventDetails as unknown as undefined);
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose when hasUnsavedChanges and closing without event details", () => {
    const onClose = vi.fn();
    const { result } = renderHook(() =>
      useDrawerCloseConfirm(true, vi.fn(), onClose),
    );

    result.current(false, undefined);
    expect(onClose).toHaveBeenCalledWith(false);
  });
});
