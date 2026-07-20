import { describe, expect, it } from "vitest";
import { getCardStatusStyle, CARD_STATUS_STYLES } from "./card-status-styles";

describe("CARD_STATUS_STYLES", () => {
  it("has all estimate statuses", () => {
    expect(CARD_STATUS_STYLES).toHaveProperty("draft");
    expect(CARD_STATUS_STYLES).toHaveProperty("sent");
    expect(CARD_STATUS_STYLES).toHaveProperty("approved");
    expect(CARD_STATUS_STYLES).toHaveProperty("declined");
    expect(CARD_STATUS_STYLES).toHaveProperty("expired");
    expect(CARD_STATUS_STYLES).toHaveProperty("converted");
  });

  it("has all work order statuses", () => {
    expect(CARD_STATUS_STYLES).toHaveProperty("New");
    expect(CARD_STATUS_STYLES).toHaveProperty("Diagnosing");
    expect(CARD_STATUS_STYLES).toHaveProperty("In Progress");
    expect(CARD_STATUS_STYLES).toHaveProperty("Ready for Pickup");
    expect(CARD_STATUS_STYLES).toHaveProperty("Completed");
    expect(CARD_STATUS_STYLES).toHaveProperty("Cancelled");
  });

  it("has all bay view statuses", () => {
    expect(CARD_STATUS_STYLES).toHaveProperty("empty");
    expect(CARD_STATUS_STYLES).toHaveProperty("in-progress");
    expect(CARD_STATUS_STYLES).toHaveProperty("waiting");
    expect(CARD_STATUS_STYLES).toHaveProperty("ready-for-pickup");
  });

  it("each style has the required fields", () => {
    for (const [key, style] of Object.entries(CARD_STATUS_STYLES)) {
      expect(style, `${key} missing bg`).toHaveProperty("bg");
      expect(style, `${key} missing ring`).toHaveProperty("ring");
      expect(style, `${key} missing text`).toHaveProperty("text");
      expect(style, `${key} missing dot`).toHaveProperty("dot");
      expect(style, `${key} missing bar`).toHaveProperty("bar");
    }
  });

  it("each style has non-empty class names", () => {
    for (const [key, style] of Object.entries(CARD_STATUS_STYLES)) {
      expect(style.bg.length, `${key} bg empty`).toBeGreaterThan(0);
      expect(style.ring.length, `${key} ring empty`).toBeGreaterThan(0);
      expect(style.text.length, `${key} text empty`).toBeGreaterThan(0);
    }
  });
});

describe("getCardStatusStyle", () => {
  it("returns draft style for 'draft'", () => {
    expect(getCardStatusStyle("draft")).toBe(CARD_STATUS_STYLES.draft);
  });

  it("returns work order style for 'New'", () => {
    expect(getCardStatusStyle("New")).toBe(CARD_STATUS_STYLES.New);
  });

  it("returns fallback for unknown status", () => {
    const result = getCardStatusStyle("unknown_status_xyz");
    // Fallback should have all the required fields
    expect(result).toHaveProperty("bg");
    expect(result).toHaveProperty("ring");
    expect(result).toHaveProperty("text");
    expect(result).toHaveProperty("dot");
    expect(result).toHaveProperty("bar");
  });

  it("returns same fallback for any unknown status", () => {
    const first = getCardStatusStyle("nonexistent_1");
    const second = getCardStatusStyle("nonexistent_2");
    expect(first).toBe(second);
  });
});
