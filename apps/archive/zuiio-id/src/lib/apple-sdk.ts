/**
 * Lazy Apple Sign In SDK loader.
 *
 * The SDK script is fetched only when the user clicks "Sign in with
 * Apple". Previously it was eagerly preloaded on every login/signup
 * page visit, putting ~43KB of third-party JS on the critical path.
 *
 * The loaded script is cached for the page lifetime; concurrent clicks
 * share a single in-flight load promise.
 */

const APPLE_SDK_URL =
  "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";

let sdkPromise: Promise<void> | null = null;

export function loadAppleSdk(): Promise<void> {
  // Already loaded — resolve immediately.
  if (window.AppleID?.auth) return Promise.resolve();

  // Already loading — reuse the in-flight request.
  if (sdkPromise) return sdkPromise;

  const { promise, resolve, reject } = Promise.withResolvers<void>();
  sdkPromise = promise;

  const script = document.createElement("script");
  script.src = APPLE_SDK_URL;
  script.async = true;
  script.onload = () => {
    // Apple's SDK bootstraps asynchronously after the script loads.
    // Resolve only when `AppleID.auth` is actually ready to use.
    const startedAt = Date.now();
    const poll = () => {
      if (window.AppleID?.auth) {
        resolve();
        return;
      }
      if (Date.now() - startedAt > 10_000) {
        sdkPromise = null;
        reject(new Error("Apple Sign In SDK failed to initialize"));
        return;
      }
      setTimeout(poll, 100);
    };
    poll();
  };
  script.onerror = () => {
    // Allow a retry on the next click.
    sdkPromise = null;
    reject(new Error("Apple Sign In SDK failed to load"));
  };
  document.head.appendChild(script);

  return promise;
}
