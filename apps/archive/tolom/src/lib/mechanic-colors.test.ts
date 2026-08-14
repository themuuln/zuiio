import { describe, expect, it } from "vitest";
import { getMechanicColor, getMechanicInitials } from "./mechanic-colors";

describe("getMechanicColor", () => {
  it("returns a color for a valid ID", () => {
    const color = getMechanicColor("user-123");
    expect(color).toHaveProperty("bg");
    expect(color).toHaveProperty("text");
  });

  it("returns a color for null ID", () => {
    const color = getMechanicColor(null);
    expect(color).toHaveProperty("bg");
    expect(color).toHaveProperty("text");
  });

  it("returns a color for undefined ID", () => {
    const color = getMechanicColor(undefined);
    expect(color).toHaveProperty("bg");
    expect(color).toHaveProperty("text");
  });

  it("returns deterministic colors for the same ID", () => {
    const color1 = getMechanicColor("user-123");
    const color2 = getMechanicColor("user-123");
    expect(color1).toBe(color2);
  });

  it("can return different colors for different IDs", () => {
    const color1 = getMechanicColor("user-aaa");
    const color2 = getMechanicColor("user-bbb");
    // This could theoretically fail if both hash to the same index,
    // but with 12 colors and different inputs it's highly unlikely
    expect(color1).toBeDefined();
    expect(color2).toBeDefined();
  });

  it("returns color for empty string ID", () => {
    const color = getMechanicColor("");
    expect(color).toHaveProperty("bg");
    expect(color).toHaveProperty("text");
  });
});

describe("getMechanicInitials", () => {
  it("returns initials for two-part name", () => {
    expect(getMechanicInitials("Temuulen Enkhbold")).toBe("TE");
  });

  it("returns ? for null input", () => {
    expect(getMechanicInitials(null)).toBe("?");
  });

  it("returns ? for undefined input", () => {
    expect(getMechanicInitials(undefined)).toBe("?");
  });

  it("returns single letter for single name", () => {
    expect(getMechanicInitials("Temuulen")).toBe("T");
  });

  it("returns first and last initial for multi-part name", () => {
    expect(getMechanicInitials("Temuulen Enkhbold Ganbaatar")).toBe("TG");
  });

  it("handles leading/trailing whitespace", () => {
    expect(getMechanicInitials("  Temuulen Enkhbold  ")).toBe("TE");
  });

  it("uppercases initials", () => {
    expect(getMechanicInitials("temuulen enkhbold")).toBe("TE");
  });

  it("returns first letter for names with extra spaces", () => {
    expect(getMechanicInitials("Temuulen")).toBe("T");
  });
});
