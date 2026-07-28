import { describe, expect, it, vi } from "vitest";
import { generateOptimisticId, isQueuedResult, QUEUED_SENTINEL } from "./query";

// ── QUEUED_SENTINEL ─────────────────────────────────────────────────────────

describe("QUEUED_SENTINEL", () => {
  it("is a symbol", () => {
    expect(typeof QUEUED_SENTINEL).toBe("symbol");
  });

  it("has a descriptive string description", () => {
    expect(QUEUED_SENTINEL.toString()).toBe("Symbol(zuiio-queued)");
  });

  it("is unique (different from other symbols)", () => {
    expect(QUEUED_SENTINEL).not.toBe(Symbol("zuiio-queued"));
  });
});

// ── isQueuedResult ──────────────────────────────────────────────────────────

describe("isQueuedResult", () => {
  it("returns true for an object with QUEUED_SENTINEL", () => {
    const result = { [QUEUED_SENTINEL]: true };
    expect(isQueuedResult(result)).toBe(true);
  });

  it("returns true for an object with QUEUED_SENTINEL set to unexpected values", () => {
    expect(isQueuedResult({ [QUEUED_SENTINEL]: false })).toBe(true);
    expect(isQueuedResult({ [QUEUED_SENTINEL]: "whatever" })).toBe(true);
    expect(isQueuedResult({ [QUEUED_SENTINEL]: 0 })).toBe(true);
    expect(isQueuedResult({ [QUEUED_SENTINEL]: null })).toBe(true);
  });

  it("returns false for null", () => {
    expect(isQueuedResult(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isQueuedResult(undefined)).toBe(false);
  });

  it("returns false for primitives (string, number, boolean)", () => {
    expect(isQueuedResult("hello")).toBe(false);
    expect(isQueuedResult(42)).toBe(false);
    expect(isQueuedResult(true)).toBe(false);
    expect(isQueuedResult(false)).toBe(false);
  });

  it("returns false for a plain object without QUEUED_SENTINEL", () => {
    expect(isQueuedResult({})).toBe(false);
    expect(isQueuedResult({ foo: "bar" })).toBe(false);
  });

  it("returns false for arrays", () => {
    expect(isQueuedResult([])).toBe(false);
    expect(isQueuedResult([1, 2, 3])).toBe(false);
  });

  it("returns false for functions", () => {
    expect(isQueuedResult(() => {})).toBe(false);
  });

  it("acts as a type guard (QueuedResult)", () => {
    const input: unknown = { [QUEUED_SENTINEL]: true };
    if (isQueuedResult(input)) {
      // TypeScript narrows — accessing QUEUED_SENTINEL is safe
      expect(input[QUEUED_SENTINEL]).toBe(true);
    } else {
      // Should never reach here
      expect.unreachable("isQueuedResult should have returned true");
    }
  });
});

// ── generateOptimisticId ────────────────────────────────────────────────────

describe("generateOptimisticId", () => {
  it("returns a string", () => {
    expect(typeof generateOptimisticId()).toBe("string");
  });

  it("returns a string of correct length (36 chars)", () => {
    const id = generateOptimisticId();
    expect(id).toHaveLength(36);
  });

  it("matches UUID v4 format (xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)", () => {
    const id = generateOptimisticId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("produces unique values on successive calls", () => {
    const ids = Array.from({ length: 100 }, () => generateOptimisticId());
    const unique = new Set(ids);
    expect(unique.size).toBe(100);
  });

  it("uses crypto.randomUUID when available", () => {
    const fakeUUID = "00000000-0000-4000-8000-000000000000";
    const randomUUID = vi.fn().mockReturnValue(fakeUUID);
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      "crypto",
    );
    Object.defineProperty(globalThis, "crypto", {
      value: { randomUUID },
      configurable: true,
      writable: true,
    });

    try {
      const result = generateOptimisticId();
      expect(randomUUID).toHaveBeenCalledOnce();
      expect(result).toBe(fakeUUID);
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(globalThis, "crypto", originalDescriptor);
      } else {
        const gt = globalThis as unknown as Record<string, unknown>;
        delete gt.crypto;
      }
    }
  });

  it("falls back to Math.random when crypto.randomUUID is unavailable", () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      "crypto",
    );
    Object.defineProperty(globalThis, "crypto", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    try {
      const id = generateOptimisticId();
      expect(id).toHaveLength(36);
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(globalThis, "crypto", originalDescriptor);
      } else {
        const gt = globalThis as unknown as Record<string, unknown>;
        delete gt.crypto;
      }
    }
  });

  it("falls back to Math.random when crypto is undefined", () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      "crypto",
    );
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- test cleanup
    delete (globalThis as unknown as Record<string, unknown>).crypto;

    try {
      const id = generateOptimisticId();
      expect(id).toHaveLength(36);
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(globalThis, "crypto", originalDescriptor);
      }
    }
  });

  it("falls back to Math.random when crypto is present but randomUUID is not a function", () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      "crypto",
    );
    Object.defineProperty(globalThis, "crypto", {
      value: { randomUUID: "not-a-function" },
      configurable: true,
      writable: true,
    });

    try {
      const id = generateOptimisticId();
      expect(id).toHaveLength(36);
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(globalThis, "crypto", originalDescriptor);
      } else {
        const gt = globalThis as unknown as Record<string, unknown>;
        delete gt.crypto;
      }
    }
  });
});
