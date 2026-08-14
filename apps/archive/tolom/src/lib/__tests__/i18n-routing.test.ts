import { describe, expect, it } from "vitest";
import { routing } from "../i18n/routing";

describe("routing", () => {
  it("defines Mongolian and English as the supported locales", () => {
    expect(routing.locales).toEqual(["mn", "en"]);
  });

  it("uses Mongolian as the default locale", () => {
    expect(routing.defaultLocale).toBe("mn");
  });

  it("strips the locale prefix from URLs", () => {
    expect(routing.localePrefix).toBe("never");
  });
});
