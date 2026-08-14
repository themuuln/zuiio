// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

const SDK_URL =
  "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";

// Test cases intentionally exercise module-loading boundaries: the loader
// keeps a module-scoped in-flight promise, so each test must re-import the
// module to get a fresh instance (static import cannot reset that state).
async function freshLoader() {
  vi.resetModules();
  return await import("./apple-sdk");
}

describe("loadAppleSdk", () => {
  afterEach(() => {
    vi.useRealTimers();
    delete window.AppleID;
    document.head.innerHTML = "";
  });

  it("injects the SDK script only when first called", async () => {
    vi.useFakeTimers();
    const { loadAppleSdk } = await freshLoader();

    expect(
      document.querySelector<HTMLScriptElement>('script[src*="appleid"]'),
    ).toBeNull();

    const promise = loadAppleSdk();
    const script = document.querySelector<HTMLScriptElement>(
      'script[src*="appleid"]',
    );
    expect(script).not.toBeNull();
    expect(script?.getAttribute("src")).toBe(SDK_URL);
    expect(script?.async).toBe(true);

    // Script onload fires, but AppleID.auth is not bootstrapped yet —
    // the promise must stay pending until the SDK is ready.
    let settled = false;
    void promise.then(() => {
      settled = true;
    });
    script?.dispatchEvent(new Event("load"));
    await vi.advanceTimersByTimeAsync(300);
    expect(settled).toBe(false);

    // SDK bootstraps → the next poll tick resolves the loader.
    window.AppleID = {
      auth: {
        init: () => {},
        signIn: async () => ({
          authorization: { code: "", id_token: "", state: "" },
        }),
      },
    };
    await vi.advanceTimersByTimeAsync(200);
    expect(settled).toBe(true);
  });

  it("does not inject a second script for concurrent calls", async () => {
    const { loadAppleSdk } = await freshLoader();

    void loadAppleSdk();
    void loadAppleSdk();
    expect(document.querySelectorAll('script[src*="appleid"]').length).toBe(1);
  });

  it("resolves immediately when the SDK is already loaded", async () => {
    const { loadAppleSdk } = await freshLoader();

    window.AppleID = {
      auth: {
        init: () => {},
        signIn: async () => ({
          authorization: { code: "", id_token: "", state: "" },
        }),
      },
    };
    await expect(loadAppleSdk()).resolves.toBeUndefined();
    expect(
      document.querySelector<HTMLScriptElement>('script[src*="appleid"]'),
    ).toBeNull();
  });

  it("rejects on script error and allows a retry", async () => {
    const { loadAppleSdk } = await freshLoader();

    const first = loadAppleSdk();
    const script = document.querySelector<HTMLScriptElement>(
      'script[src*="appleid"]',
    );
    expect(script).not.toBeNull();
    script?.dispatchEvent(new Event("error"));
    await expect(first).rejects.toThrow("failed to load");

    // Retry creates a fresh script and can succeed.
    window.AppleID = {
      auth: {
        init: () => {},
        signIn: async () => ({
          authorization: { code: "", id_token: "", state: "" },
        }),
      },
    };
    await expect(loadAppleSdk()).resolves.toBeUndefined();
  });
});
