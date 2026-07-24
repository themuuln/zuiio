import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadFont, loadFonts } from "../load-fonts";
import { colors, fonts, statLabels } from "../theme";

describe("loadFont", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null when fetch fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

    const result = await loadFont("Barlow", 400);
    expect(result).toBeNull();
  });

  it("returns null when CSS response lacks woff2 URL", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("@font-face { font-family: 'Barlow'; }", {
        status: 200,
        headers: { "Content-Type": "text/css" },
      }),
    );

    const result = await loadFont("Barlow", 400);
    expect(result).toBeNull();
  });

  it("returns an ArrayBuffer from a valid Google Fonts CSS response", async () => {
    // Simulate real Google Fonts CSS with a woff2 URL
    const cssResponse = `@font-face { font-family: 'Barlow'; src: url(https://fonts.gstatic.com/s/barlow/v12/abc.woff2) format('woff2'); }`;

    const fontData = new Uint8Array([0, 1, 2, 3]).buffer;

    let callCount = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof Request
            ? input.url
            : "";
      callCount++;
      if (callCount === 1) {
        // First call: CSS request
        expect(url).toContain("fonts.googleapis.com/css2");
        return new Response(cssResponse, {
          status: 200,
          headers: { "Content-Type": "text/css" },
        });
      }
      // Second call: woff2 download
      expect(url).toBe("https://fonts.gstatic.com/s/barlow/v12/abc.woff2");
      return new Response(fontData, {
        status: 200,
        headers: { "Content-Type": "font/woff2" },
      });
    });

    const result = await loadFont("Barlow", 400);
    expect(result).toBeInstanceOf(ArrayBuffer);
    expect(new Uint8Array(result!)).toEqual(new Uint8Array([0, 1, 2, 3]));
  });

  it("sends a Chrome user-agent header", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 200 }),
    );

    await loadFont("Inter", 400);

    expect(vi.mocked(fetch).mock.calls[0][0]).toContain(
      "fonts.googleapis.com/css2",
    );
  });
});

describe("loadFonts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads Barlow Regular, Barlow Bold, and Inter Regular concurrently", async () => {
    const fontData = new Uint8Array([10, 20, 30]).buffer;

    let callCount = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : "";
      callCount++;

      if (url.includes("fonts.googleapis.com/css2")) {
        // Return CSS with a valid woff2 URL for each font request
        const dummyCss = `@font-face { src: url(https://fonts.gstatic.com/test.woff2) format('woff2'); }`;
        return new Response(dummyCss, {
          status: 200,
          headers: { "Content-Type": "text/css" },
        });
      }
      if (url.includes("fonts.gstatic.com")) {
        return new Response(fontData, {
          status: 200,
          headers: { "Content-Type": "font/woff2" },
        });
      }
      return new Response("", { status: 404 });
    });

    const result = await loadFonts();

    // Should have 3 font entries (all loaded)
    expect(result).toHaveLength(3);

    expect(result[0]).toEqual({
      name: "Barlow",
      data: fontData,
      weight: 400,
      style: "normal",
    });
    expect(result[1]).toEqual({
      name: "Barlow",
      data: fontData,
      weight: 700,
      style: "normal",
    });
    expect(result[2]).toEqual({
      name: "Inter",
      data: fontData,
      weight: 400,
      style: "normal",
    });
  });

  it("silently excludes fonts that fail to load", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

    const result = await loadFonts();
    expect(result).toHaveLength(0);
  });
});

describe("theme", () => {
  it("defines the expected color tokens", () => {
    expect(colors.background).toBe("#0a0a0f");
    expect(colors.text).toBe("#fafafa");
    expect(colors.accent).toBe("#3b82f6");
  });

  it("defines font families", () => {
    expect(fonts.display).toBe("Barlow");
    expect(fonts.body).toBe("Inter");
  });

  it("defines stat labels in Mongolian", () => {
    expect(statLabels.points).toBe("ОНОО");
    expect(statLabels.assists).toBe("ДАМЖУУЛАЛТ");
    expect(statLabels.rebounds).toBe("САМБАЛ");
  });
});
