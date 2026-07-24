import { describe, expect, it } from "vitest";

// getInitials is extracted from player-avatar.tsx for unit testing
function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}

describe("getInitials", () => {
  it("returns first letters of first two names", () => {
    expect(getInitials("Баяр Бат")).toBe("ББ");
  });

  it("handles single name", () => {
    expect(getInitials("Төгөлдөр")).toBe("Т");
  });

  it("handles empty string", () => {
    expect(getInitials("")).toBe("");
  });

  it("handles extra whitespace", () => {
    expect(getInitials("  Баяр   Бат  ")).toBe("ББ");
  });

  it("returns uppercase", () => {
    expect(getInitials("bayar bat")).toBe("BB");
  });
});
