import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePersistedState } from "./use-persisted-state";

describe("usePersistedState", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns defaultValue when localStorage is empty", () => {
    const { result } = renderHook(() =>
      usePersistedState("test-key", "default"),
    );
    expect(result.current[0]).toBe("default");
  });

  it("returns stored value when localStorage has data", () => {
    localStorage.setItem("test-key", JSON.stringify("stored"));
    const { result } = renderHook(() =>
      usePersistedState("test-key", "default"),
    );
    expect(result.current[0]).toBe("stored");
  });

  it("updates localStorage when state changes", () => {
    const { result } = renderHook(() =>
      usePersistedState("test-key", "default"),
    );
    expect(result.current[0]).toBe("default");

    act(() => {
      result.current[1]("updated");
    });

    expect(result.current[0]).toBe("updated");
    expect(localStorage.getItem("test-key")).toBe(JSON.stringify("updated"));
  });

  it("falls back to defaultValue when JSON.parse fails", () => {
    localStorage.setItem("test-key", "not-valid-json");
    const { result } = renderHook(() =>
      usePersistedState("test-key", "fallback"),
    );
    expect(result.current[0]).toBe("fallback");
  });
});
