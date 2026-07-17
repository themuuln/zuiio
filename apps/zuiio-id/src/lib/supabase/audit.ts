import { dispatchWebhook } from "@/lib/webhooks";
import type { AuthErrorCode } from "../errors";
import { createAdminClient } from "./server";

export type AuditEventType =
  | "consent_approved"
  | "consent_denied"
  | "grant_revoked"
  | "session_revoked"
  | "mfa_enrolled"
  | "mfa_unenrolled"
  | "mfa_verified"
  | "oauth_error";

interface AuditEvent {
  eventType: AuditEventType;
  userId?: string;
  clientId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Insert an SSO audit event. Failures are logged to console.error but
 * never propagate — audit failures must not block OAuth decisions.
 */
export async function auditEvent(event: AuditEvent): Promise<void> {
  try {
    const admin = await createAdminClient();
    const { error } = await admin.from("sso_audit_events").insert({
      event_type: event.eventType,
      user_id: event.userId ?? null,
      client_id: event.clientId ?? null,
      ip_address: event.ipAddress ?? null,
      user_agent: event.userAgent ? event.userAgent.slice(0, 512) : null,
      metadata: event.metadata ?? null,
    });
    if (error) {
      console.error("Audit insert failed:", error.message);
    } else {
      // Dispatch webhook (fire-and-forget)
      void dispatchWebhook(event.eventType, {
        user_id: event.userId,
        client_id: event.clientId,
        ip_address: event.ipAddress,
        event_type: event.eventType,
        metadata: event.metadata,
      });
    }
  } catch (err) {
    console.error("Audit event error:", err);
  }
}

/**
 * Log an OAuth error as an audit event with the error code in metadata.
 */
export async function auditOAuthError(
  code: AuthErrorCode,
  userId?: string,
  clientId?: string,
  ip?: string,
  ua?: string,
): Promise<void> {
  return auditEvent({
    eventType: "oauth_error",
    userId,
    clientId,
    ipAddress: ip,
    userAgent: ua,
    metadata: { error_code: code },
  });
}

/** Extract IP from trusted Vercel/Next.js headers. */
export function extractIp(headers: Headers): string | undefined {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    undefined
  );
}

/** Extract a truncated user-agent string. */
export function extractUserAgent(headers: Headers): string | undefined {
  const ua = headers.get("user-agent");
  return ua ? ua.slice(0, 512) : undefined;
}
