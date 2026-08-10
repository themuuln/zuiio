import { beforeEach, describe, expect, it, vi } from "vitest";
import enMessages from "../../messages/en.json";
import mnMessages from "../../messages/mn.json";

vi.mock("next-intl", () => ({
  hasLocale: (
    locales: readonly string[],
    locale: string | undefined,
  ): boolean => (locale ? locales.includes(locale) : false),
}));
vi.mock("next-intl/server", () => ({
  getRequestConfig: (factory: unknown) => factory,
}));

import getRequestConfig from "../i18n/request";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getRequestConfig", () => {
  it("uses the requested locale with its messages", async () => {
    const config = await getRequestConfig({
      requestLocale: Promise.resolve("en"),
    });

    expect(config.locale).toBe("en");
    expect(config.messages).toBe(enMessages);
  });

  it("uses Mongolian messages for the default locale", async () => {
    const config = await getRequestConfig({
      requestLocale: Promise.resolve("mn"),
    });

    expect(config.locale).toBe("mn");
    expect(config.messages).toBe(mnMessages);
  });

  it("falls back to the default locale for an unsupported locale", async () => {
    const config = await getRequestConfig({
      requestLocale: Promise.resolve("fr"),
    });

    expect(config.locale).toBe("mn");
    expect(config.messages).toBe(mnMessages);
  });

  it("falls back to the default locale when no locale is resolved", async () => {
    const config = await getRequestConfig({
      requestLocale: Promise.resolve(undefined),
    });

    expect(config.locale).toBe("mn");
    expect(config.messages).toBe(mnMessages);
  });
});
