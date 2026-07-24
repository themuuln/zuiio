import { createAdminClient } from "@/lib/supabase/server";

const MAX_ATTEMPTS = 5; // max failed attempts
const WINDOW_MS = 15 * 60 * 1000; // 15-minute window

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds?: number;
}

/**
 * Check if an identifier (email/username) or IP is rate-limited.
 * Returns whether the attempt is allowed and how many attempts remain.
 *
 * Fails open: if the DB is unreachable, the attempt is allowed.
 */
export async function checkRateLimit(
  identifier: string,
  _ipAddress?: string,
): Promise<RateLimitResult> {
  try {
    const admin = await createAdminClient();
    const windowStart = new Date(Date.now() - WINDOW_MS).toISOString();

    // Count failed attempts in the window
    const { count } = await admin
      .from("login_attempts")
      .select("*", { count: "exact", head: true })
      .eq("identifier", identifier.toLowerCase())
      .eq("success", false)
      .gte("attempted_at", windowStart);

    const failedCount = count ?? 0;

    if (failedCount >= MAX_ATTEMPTS) {
      // Calculate when the oldest attempt in the window will expire
      const { data: oldest } = await admin
        .from("login_attempts")
        .select("attempted_at")
        .eq("identifier", identifier.toLowerCase())
        .eq("success", false)
        .gte("attempted_at", windowStart)
        .order("attempted_at", { ascending: true })
        .limit(1)
        .single();

      const retryAfter = oldest
        ? Math.ceil(
            (new Date(oldest.attempted_at).getTime() + WINDOW_MS - Date.now()) /
              1000,
          )
        : Math.ceil(WINDOW_MS / 1000);

      return {
        allowed: false,
        remainingAttempts: 0,
        retryAfterSeconds: Math.max(retryAfter, 60),
      };
    }

    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS - failedCount,
    };
  } catch {
    // Fail open — rate limiting should never block a request if the DB is down
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }
}

/**
 * Check if an IP address is rate-limited for API endpoints.
 * Uses login_attempts table with IP-based tracking.
 * Default: 30 attempts per 15 minutes per IP.
 */
export async function checkApiRateLimit(
  ipAddress: string,
  endpoint: string,
  maxAttempts = 30,
): Promise<RateLimitResult> {
  try {
    const admin = createAdminClient();
    const windowStart = new Date(Date.now() - WINDOW_MS).toISOString();
    const identifier = `api:${endpoint}:${ipAddress}`;

    const { count } = await admin
      .from("login_attempts")
      .select("*", { count: "exact", head: true })
      .eq("identifier", identifier)
      .gte("attempted_at", windowStart);

    const attemptCount = count ?? 0;

    if (attemptCount >= maxAttempts) {
      const { data: oldest } = await admin
        .from("login_attempts")
        .select("attempted_at")
        .eq("identifier", identifier)
        .gte("attempted_at", windowStart)
        .order("attempted_at", { ascending: true })
        .limit(1)
        .single();

      const retryAfter = oldest
        ? Math.ceil(
            (new Date(oldest.attempted_at).getTime() + WINDOW_MS - Date.now()) /
              1000,
          )
        : Math.ceil(WINDOW_MS / 1000);

      return {
        allowed: false,
        remainingAttempts: 0,
        retryAfterSeconds: Math.max(retryAfter, 60),
      };
    }

    return {
      allowed: true,
      remainingAttempts: maxAttempts - attemptCount,
    };
  } catch {
    return { allowed: true, remainingAttempts: maxAttempts };
  }
}

/**
 * Record an API attempt for rate limiting.
 */
export async function recordApiAttempt(
  ipAddress: string,
  endpoint: string,
): Promise<void> {
  try {
    const admin = createAdminClient();
    const identifier = `api:${endpoint}:${ipAddress}`;

    await admin.from("login_attempts").insert({
      identifier,
      success: true,
      ip_address: ipAddress,
    });
  } catch {
    // Best-effort
  }
}

/**
 * Check if an email is rate-limited for password reset emails.
 * Lower threshold: 3 attempts per 15 minutes.
 * Fails open.
 */
export async function checkPasswordResetRateLimit(
  email: string,
): Promise<RateLimitResult> {
  const RESET_MAX_ATTEMPTS = 3;

  try {
    const admin = await createAdminClient();
    const windowStart = new Date(Date.now() - WINDOW_MS).toISOString();

    const { count } = await admin
      .from("login_attempts")
      .select("*", { count: "exact", head: true })
      .eq("identifier", email.toLowerCase())
      .gte("attempted_at", windowStart);

    const recentCount = count ?? 0;

    if (recentCount >= RESET_MAX_ATTEMPTS) {
      const { data: oldest } = await admin
        .from("login_attempts")
        .select("attempted_at")
        .eq("identifier", email.toLowerCase())
        .gte("attempted_at", windowStart)
        .order("attempted_at", { ascending: true })
        .limit(1)
        .single();

      const retryAfter = oldest
        ? Math.ceil(
            (new Date(oldest.attempted_at).getTime() + WINDOW_MS - Date.now()) /
              1000,
          )
        : Math.ceil(WINDOW_MS / 1000);

      return {
        allowed: false,
        remainingAttempts: 0,
        retryAfterSeconds: Math.max(retryAfter, 60),
      };
    }

    return {
      allowed: true,
      remainingAttempts: RESET_MAX_ATTEMPTS - recentCount,
    };
  } catch {
    return { allowed: true, remainingAttempts: RESET_MAX_ATTEMPTS };
  }
}

/**
 * Record a login attempt (success or failure).
 */
export async function recordLoginAttempt(
  identifier: string,
  success: boolean,
  ipAddress?: string,
): Promise<void> {
  try {
    const admin = await createAdminClient();
    await admin.from("login_attempts").insert({
      identifier: identifier.toLowerCase(),
      success,
      ip_address: ipAddress ?? null,
    });
  } catch {
    // Never block auth flow on audit failure
  }
}

/**
 * Clean up old login attempts (older than 24 hours).
 * Call this periodically or after recording attempts.
 */
export async function cleanupOldAttempts(): Promise<void> {
  try {
    const admin = await createAdminClient();
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await admin.from("login_attempts").delete().lt("attempted_at", cutoff);
  } catch {
    // Best-effort cleanup
  }
}
