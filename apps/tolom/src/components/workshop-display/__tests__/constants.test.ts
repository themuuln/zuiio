import { describe, expect, it } from "vitest";
import {
  STATUS_BADGE_COLORS,
  STATUS_COLORS,
  STATUS_DISPLAY_NAMES,
} from "../constants";

describe("workshop-display constants", () => {
  it("maps every display name to a status color", () => {
    for (const status of Object.keys(STATUS_DISPLAY_NAMES)) {
      expect(STATUS_COLORS[status], status).toBeDefined();
      expect(STATUS_BADGE_COLORS[status], status).toBeDefined();
    }
  });

  it("covers the known work order statuses", () => {
    for (const status of [
      "New",
      "Diagnosing",
      "In Progress",
      "Ready for Pickup",
      "Completed",
      "Cancelled",
    ]) {
      expect(STATUS_COLORS[status]).toBeDefined();
      expect(STATUS_BADGE_COLORS[status]).toBeDefined();
    }
  });

  it("shortens Ready for Pickup to Ready for the card badge", () => {
    expect(STATUS_DISPLAY_NAMES["Ready for Pickup"]).toBe("Ready");
  });

  it("keeps other status names unchanged", () => {
    expect(STATUS_DISPLAY_NAMES.New).toBe("New");
    expect(STATUS_DISPLAY_NAMES.Completed).toBe("Completed");
    expect(STATUS_DISPLAY_NAMES.Cancelled).toBe("Cancelled");
  });
});
