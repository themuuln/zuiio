/**
 * Navigates to login, preserving the intended destination so the user
 * can be redirected back after signing in.
 */
export function redirectToLogin(): void {
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
