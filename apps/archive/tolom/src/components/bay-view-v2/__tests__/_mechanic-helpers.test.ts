import { describe, expect, it } from "vitest";
import type { HelperRef, MechanicPickerOption } from "@/lib/types/mechanic";
import { buildSelectedMechanics } from "../_mechanic-helpers";

const mechanics: MechanicPickerOption[] = [
  { id: "m1", full_name: "Lead One", current_jobs: 2 },
  { id: "m2", full_name: "Helper Two", current_jobs: 0 },
  { id: "m3", full_name: "Helper Three", current_jobs: 1 },
  { id: "m4", full_name: "Unassigned Four", current_jobs: 0 },
];

describe("buildSelectedMechanics", () => {
  it("returns [] when nothing is selected", () => {
    expect(buildSelectedMechanics(null, [], mechanics)).toEqual([]);
  });

  it("places the lead first, then helpers in order", () => {
    const helpers: HelperRef[] = [
      { id: "h1", mechanic_id: "m2" },
      { id: "h2", mechanic_id: "m3" },
    ];
    const result = buildSelectedMechanics("m1", helpers, mechanics);
    expect(result.map((m) => m.id)).toEqual(["m1", "m2", "m3"]);
  });

  it("skips the helper that is also the lead", () => {
    const helpers: HelperRef[] = [
      { id: "h1", mechanic_id: "m1" },
      { id: "h2", mechanic_id: "m3" },
    ];
    const result = buildSelectedMechanics("m1", helpers, mechanics);
    expect(result.map((m) => m.id)).toEqual(["m1", "m3"]);
  });

  it("falls back to helper.id when mechanic_id is missing", () => {
    const helpers: HelperRef[] = [{ id: "m2" }, { id: "m3" }];
    const result = buildSelectedMechanics(null, helpers, mechanics);
    expect(result.map((m) => m.id)).toEqual(["m2", "m3"]);
  });

  it("drops unknown mechanic ids but preserves duplicate helpers as listed", () => {
    const helpers: HelperRef[] = [
      { id: "h1", mechanic_id: "ghost" },
      { id: "h2", mechanic_id: "m2" },
      { id: "h3", mechanic_id: "m2" },
    ];
    const result = buildSelectedMechanics("m1", helpers, mechanics);
    expect(result.map((m) => m.id)).toEqual(["m1", "m2", "m2"]);
  });

  it("does not append unassigned mechanics", () => {
    const result = buildSelectedMechanics(
      "m1",
      [{ id: "h1", mechanic_id: "m2" }],
      mechanics,
    );
    expect(result.map((m) => m.id)).not.toContain("m4");
  });
});
