import { describe, expect, it } from "vitest";
import { getCompactName } from "./name";

describe("getCompactName", () => {
  it("returns ? for null input", () => {
    expect(getCompactName(null)).toBe("?");
  });

  it("returns ? for undefined input", () => {
    expect(getCompactName(undefined)).toBe("?");
  });

  it("returns single name as-is", () => {
    expect(getCompactName("Temuulen")).toBe("Temuulen");
  });

  it("returns first initial and last name for two-part name", () => {
    expect(getCompactName("Temuulen Enkhbold")).toBe("T. Enkhbold");
  });

  it("returns first initial and rest for multi-part name", () => {
    expect(getCompactName("Temuulen Enkhbold Ganbaatar")).toBe("T. Enkhbold Ganbaatar");
  });

  it("handles leading/trailing whitespace", () => {
    expect(getCompactName("  Temuulen Enkhbold  ")).toBe("T. Enkhbold");
  });

  it("uppercases the initial", () => {
    expect(getCompactName("temuulen enkhbold")).toBe("T. enkhbold");
  });

  it("handles empty string", () => {
    expect(getCompactName("")).toBe("?");
  });
});
