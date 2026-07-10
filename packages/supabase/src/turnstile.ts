/**
 * Validate a Cloudflare Turnstile token server-side.
 * Call this in server actions / API routes after the client submits the form.
 *
 * @param token - The `cf-turnstile-response` value from the hidden form field
 * @param remoteIp - Optional: the user's IP for extra validation
 * @returns `{ success: true }` or `{ success: false, error: string }`
 */
export async function validateTurnstile(
  token: string | null | undefined,
  remoteIp?: string,
): Promise<{ success: boolean; error?: string }> {
  // Always skip in development — the widget isn't rendered there
  if (process.env.NODE_ENV === "development") {
    return { success: true };
  }

  const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    if (!token) {
      return { success: false, error: "Missing Turnstile token" };
    }
    return { success: false, error: "Bot protection not configured" };
  }

  if (!token) {
    return { success: false, error: "Missing Turnstile token" };
  }

  const formData = new URLSearchParams();
  formData.append("secret", secretKey);
  formData.append("response", token);
  if (remoteIp) {
    formData.append("remoteip", remoteIp);
  }

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      },
    );

    const result = (await res.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };

    if (!result.success) {
      return { success: false, error: "Bot verification failed" };
    }

    return { success: true };
  } catch {
    // Fail open on network errors to avoid locking out users
    return { success: true };
  }
}
