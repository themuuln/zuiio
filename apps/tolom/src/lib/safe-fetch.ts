/**
 * Drop-in replacement for `fetch` in client-side query hooks.
 * Intercepts 401 responses with the `X-Auth-Required` header and
 * redirects to login before the caller can handle the error.
 *
 * Usage: replace `fetch(url)` with `safeFetch(url)` in queryFn/mutationFn.
 */
export async function safeFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(input, init);

  if (
    res.status === 401 &&
    res.headers.get("X-Auth-Required") === "true"
  ) {
    // Import dynamically to avoid bundling issues in edge/server runtimes
    const { redirectToLogin } = await import("@/lib/auth-redirect");
    redirectToLogin();
    // Throw so the caller doesn't process a stale/unauthenticated response
    throw new Error("Session expired");
  }

  return res;
}
