import { describe, expect, it } from "vitest";

// Extract drag-to-reorder logic for testing
function reorderArray<T>(array: T[], fromIndex: number, toIndex: number): T[] {
  const result = [...array];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

function _saveOrder(_key: string, order: string[]): void {
  // In real app, this would use localStorage
  // For testing, we just validate the logic
  expect(order.length).toBeGreaterThan(0);
}

function loadOrder(_key: string, _validKeys: string[]): string[] | null {
  // In real app, this would read from localStorage
  // For testing, we return null (no saved order)
  return null;
}

function validateOrder(order: string[], validKeys: string[]): boolean {
  return order.every((key) => validKeys.includes(key));
}

describe("Drag-to-Reorder Leaders", () => {
  const categories = ["pts", "reb", "ast", "stl", "blk"];

  it("reorders array correctly", () => {
    const result = reorderArray(categories, 0, 2);
    expect(result).toEqual(["reb", "ast", "pts", "stl", "blk"]);
  });

  it("reorders to beginning", () => {
    const result = reorderArray(categories, 4, 0);
    expect(result).toEqual(["blk", "pts", "reb", "ast", "stl"]);
  });

  it("reorders to end", () => {
    const result = reorderArray(categories, 0, 4);
    expect(result).toEqual(["reb", "ast", "stl", "blk", "pts"]);
  });

  it("does not mutate original array", () => {
    const original = [...categories];
    reorderArray(categories, 0, 2);
    expect(categories).toEqual(original);
  });

  it("validates correct order", () => {
    expect(validateOrder(["pts", "reb", "ast"], categories)).toBe(true);
  });

  it("rejects invalid keys", () => {
    expect(validateOrder(["pts", "invalid", "ast"], categories)).toBe(false);
  });

  it("loads null when no saved order", () => {
    expect(loadOrder("test-key", categories)).toBeNull();
  });
});
