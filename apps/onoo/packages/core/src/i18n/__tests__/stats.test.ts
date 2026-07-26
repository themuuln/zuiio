import { describe, expect, it } from "vitest";
import { getStatLabel, MILESTONE_LABELS, STAT_LABELS } from "../stats";

describe("STAT_LABELS", () => {
  it("has matching keys in mn and en", () => {
    const mnKeys = Object.keys(STAT_LABELS.mn).sort();
    const enKeys = Object.keys(STAT_LABELS.en).sort();
    expect(mnKeys).toEqual(enKeys);
  });

  it("contains all expected stat keys", () => {
    expect(STAT_LABELS.mn).toHaveProperty("pts");
    expect(STAT_LABELS.mn).toHaveProperty("reb");
    expect(STAT_LABELS.mn).toHaveProperty("ast");
    expect(STAT_LABELS.mn).toHaveProperty("stl");
    expect(STAT_LABELS.mn).toHaveProperty("blk");
    expect(STAT_LABELS.mn).toHaveProperty("tov");
    expect(STAT_LABELS.mn).toHaveProperty("pf");
  });

  it("has non-empty Mongolian labels", () => {
    for (const [_key, val] of Object.entries(STAT_LABELS.mn)) {
      expect(val).toBeTruthy();
    }
  });

  it("has non-empty English labels", () => {
    for (const [_key, val] of Object.entries(STAT_LABELS.en)) {
      expect(val).toBeTruthy();
    }
  });
});

describe("getStatLabel", () => {
  it("returns Mongolian label by default", () => {
    expect(getStatLabel("pts")).toBe("Оноо");
    expect(getStatLabel("reb")).toBe("Буулт");
    expect(getStatLabel("ast")).toBe("Олгосон");
  });

  it("returns English label when locale is en", () => {
    expect(getStatLabel("pts", "en")).toBe("PTS");
    expect(getStatLabel("reb", "en")).toBe("REB");
    expect(getStatLabel("ast", "en")).toBe("AST");
  });

  it("returns the key itself for unknown stats", () => {
    expect(getStatLabel("unknown" as never)).toBe("unknown");
    expect(getStatLabel("xyz" as never, "en")).toBe("xyz");
  });

  it("is a pure function (no mutation)", () => {
    const original = STAT_LABELS.mn.pts;
    getStatLabel("pts");
    expect(STAT_LABELS.mn.pts).toBe(original);
  });
});

describe("MILESTONE_LABELS", () => {
  it("has Mongolian labels for all milestones", () => {
    for (const [_key, val] of Object.entries(MILESTONE_LABELS)) {
      expect(val.mn).toBeTruthy();
    }
  });

  it("has English labels for all milestones", () => {
    for (const [_key, val] of Object.entries(MILESTONE_LABELS)) {
      expect(val.en).toBeTruthy();
    }
  });

  it("includes career_high_pts", () => {
    expect(MILESTONE_LABELS.career_high_pts.mn).toBe("Онооны карьерийн дээд");
  });

  it("includes triple_double in both locales", () => {
    expect(MILESTONE_LABELS.triple_double.mn).toBe("Гурван-X");
    expect(MILESTONE_LABELS.triple_double.en).toBe("Triple-Double");
  });
});
