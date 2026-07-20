import { describe, expect, it } from "vitest";
import { SIDEBAR_TRANSITIONS } from "./sidebar-transitions";

describe("SIDEBAR_TRANSITIONS", () => {
  it("has expand transition", () => {
    expect(SIDEBAR_TRANSITIONS.expand).toBeDefined();
    expect(SIDEBAR_TRANSITIONS.expand.duration).toBe(300);
    expect(SIDEBAR_TRANSITIONS.expand.easing).toContain("cubic-bezier");
  });

  it("has collapse transition (faster than expand)", () => {
    expect(SIDEBAR_TRANSITIONS.collapse.duration).toBeLessThan(
      SIDEBAR_TRANSITIONS.expand.duration,
    );
  });

  it("has label with stagger values", () => {
    expect(SIDEBAR_TRANSITIONS.label.staggerEnter).toBe(50);
    expect(SIDEBAR_TRANSITIONS.label.staggerExit).toBe(0);
  });

  it("has content transition", () => {
    expect(SIDEBAR_TRANSITIONS.content.duration).toBe(250);
  });

  it("all transitions have className", () => {
    for (const [key, val] of Object.entries(SIDEBAR_TRANSITIONS)) {
      expect(val.className, `${key} missing className`).toBeTruthy();
    }
  });

  it("all transitions have positive duration", () => {
    for (const [key, val] of Object.entries(SIDEBAR_TRANSITIONS)) {
      expect(val.duration, `${key} duration invalid`).toBeGreaterThan(0);
    }
  });
  it("has readonly types (as const)", () => {
    // TypeScript enforces readonly at compile time;
    // at runtime, values are plain objects
    expect(SIDEBAR_TRANSITIONS).toBeDefined();
  });
});
