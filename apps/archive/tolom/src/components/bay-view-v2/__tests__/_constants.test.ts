import { describe, expect, it } from "vitest";
import {
  ALL_STATUSES,
  STATUS_ACCENT,
  STATUS_BADGE_CLASS,
  STATUS_BG,
  STATUS_BORDER,
  STATUS_BORDER_LEFT,
  STATUS_BTN_SOLID,
  STATUS_COLUMN,
  STATUS_DOT,
  STATUS_FILTER_ACTIVE,
  STATUS_PILL,
  STATUS_PRIMARY,
  STATUS_STEPPER,
  STATUS_TIMELINE_DOT,
  STATUS_TIMELINE_TEXT,
  STATUS_TRANSLATION_KEYS,
  URGENCY_CRITICAL,
  URGENCY_WARNING,
} from "../_constants";

const STATUSES = [
  "New",
  "Diagnosing",
  "In Progress",
  "Ready for Pickup",
  "Completed",
  "Cancelled",
] as const;

describe("bay-view status constants", () => {
  it("exposes every defined status in ALL_STATUSES", () => {
    expect(ALL_STATUSES).toEqual([...STATUSES]);
  });

  it("derives every variant map for every status", () => {
    const maps = [
      STATUS_ACCENT,
      STATUS_BADGE_CLASS,
      STATUS_BG,
      STATUS_BORDER,
      STATUS_BORDER_LEFT,
      STATUS_BTN_SOLID,
      STATUS_COLUMN,
      STATUS_DOT,
      STATUS_FILTER_ACTIVE,
      STATUS_PILL,
      STATUS_PRIMARY,
      STATUS_STEPPER,
      STATUS_TIMELINE_DOT,
      STATUS_TIMELINE_TEXT,
      STATUS_TRANSLATION_KEYS,
    ];
    for (const status of STATUSES) {
      for (const map of maps) {
        expect(
          typeof map[status],
          `${status} missing from ${map.constructor.name}`,
        ).toBe("string");
      }
    }
  });

  it("maps each status to its primary hue", () => {
    expect(STATUS_PRIMARY).toEqual({
      New: "amber",
      Diagnosing: "blue",
      "In Progress": "teal",
      "Ready for Pickup": "emerald",
      Completed: "emerald",
      Cancelled: "rose",
    });
  });

  it("marks terminal statuses with translucent accents and others solid", () => {
    expect(STATUS_ACCENT.Completed).toBe("bg-emerald-400/40");
    expect(STATUS_ACCENT.Cancelled).toBe("bg-rose-400/40");
    expect(STATUS_ACCENT.New).toBe("bg-amber-500");
    expect(STATUS_ACCENT["Ready for Pickup"]).toBe("bg-emerald-500");
  });

  it("keeps button fills at a minimum 500 weight for contrast", () => {
    expect(STATUS_BTN_SOLID.Completed).toBe("bg-emerald-500");
    expect(STATUS_BTN_SOLID.Cancelled).toBe("bg-rose-500");
    expect(STATUS_BTN_SOLID.New).toBe("bg-amber-500");
    expect(STATUS_BTN_SOLID.Diagnosing).toBe("bg-blue-500");
  });

  it("uses the hex palette for left border accents", () => {
    expect(STATUS_BORDER_LEFT.New).toBe("#f59e0b");
    expect(STATUS_BORDER_LEFT["In Progress"]).toBe("#14b8a6");
    expect(STATUS_BORDER_LEFT.Completed).toBe("#34d399");
    expect(STATUS_BORDER_LEFT.Cancelled).toBe("#fb7185");
  });

  it("builds the pill classes with light bg and 700 text", () => {
    expect(STATUS_PILL.New).toBe(
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    );
    expect(STATUS_PILL.Completed).toBe(
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    );
  });

  it("builds badge classes with translucent bg, dark text and /25 border", () => {
    expect(STATUS_BADGE_CLASS.New).toBe(
      "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/25",
    );
    expect(STATUS_BADGE_CLASS.Completed).toBe(
      "bg-emerald-400/10 text-emerald-600 dark:text-emerald-300 border-emerald-400/25",
    );
  });

  it("combines border-top and tint bg for kanban columns", () => {
    expect(STATUS_COLUMN["In Progress"]).toBe(
      "border-t-teal-500 bg-teal-500/5",
    );
  });

  it("derives timeline text and ring dots", () => {
    expect(STATUS_TIMELINE_TEXT.New).toBe("text-amber-600 dark:text-amber-300");
    expect(STATUS_TIMELINE_DOT.New).toBe("bg-amber-500 ring-amber-500/20");
  });

  it("exposes urgency markers and translation keys for all statuses", () => {
    expect(URGENCY_WARNING).toBe("bg-amber-500");
    expect(URGENCY_CRITICAL).toBe("bg-rose-500");
    expect(STATUS_TRANSLATION_KEYS).toEqual({
      New: "statusNew",
      Diagnosing: "statusDiagnosing",
      "In Progress": "statusInProgress",
      "Ready for Pickup": "statusReadyForPickup",
      Completed: "statusCompleted",
      Cancelled: "statusCancelled",
    });
  });
});
