/**
 * Navigates to login, preserving the intended destination so the user
 * can be redirected back after signing in.
 */
export function redirectToLogin(): void {
  // Prevent multiple parallel queries from triggering competing redirects.
  // Once a redirect is in-flight, subsequent calls are no-ops.
  if (sessionStorage.getItem("__auth_redirect_inflight")) return;
  sessionStorage.setItem("__auth_redirect_inflight", "1");

  const loginUrl = new URL("/auth/login", window.location.origin);
  loginUrl.searchParams.set("redirectTo", window.location.href);
  window.location.href = loginUrl.toString();
}

/**
 * Checks a fetch Response for our `X-Auth-Required: true` header (set by
 * handleApiError on 401) and redirects to login if present.
 * Returns true if a redirect was triggered, false otherwise.
 */
export function handleAuthRedirect(response: Response): boolean {
  if (
    response.status === 401 &&
    response.headers.get("X-Auth-Required") === "true"
  ) {
    redirectToLogin();
    return true;
  }
  return false;
}
