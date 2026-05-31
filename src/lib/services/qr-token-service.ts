import { revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/cache/keys";
import { createClient } from "@/lib/supabase/server";

// ── Types ──────────────────────────────────────────────────────────────────

export interface ClockToken {
  rawToken: string;
  sessionId: string;
  expiresAt: string;
}

export interface VerifiedClockToken {
  valid: boolean;
  reason?: string;
  sessionId?: string;
  actionType?: "clock_in" | "clock_out";
}

export interface DeviceRegistration {
  success: boolean;
  deviceId: string;
}

export interface DeviceInfo {
  deviceId: string;
  mechanicId: string;
  mechanicName: string | null;
  deviceName: string | null;
  deviceFingerprint: string;
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
  isActive: boolean;
}

// ── Generate QR Clock Token ───────────────────────────────────────────────

/**
 * Generate a short-lived (60s) single-use token for QR clock-in/out.
 * The raw token is encoded into the QR; the server stores only its SHA-256 hash.
 */
export async function generateClockToken(
  orgId: string,
  actionType: "clock_in" | "clock_out",
): Promise<ClockToken> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("generate_clock_token", {
    p_org_id: orgId,
    p_action_type: actionType,
  });

  if (error) throw error;
  if (!data) throw new Error("Failed to generate clock token");

  const result = data as {
    raw_token: string;
    session_id: string;
    expires_at: string;
  };
  return {
    rawToken: result.raw_token,
    sessionId: result.session_id,
    expiresAt: result.expires_at,
  };
}

// ── Verify and Claim Token ────────────────────────────────────────────────

/**
 * Verify a QR-scanned token and claim it (single-use).
 * Called by the phone app after scanning a QR code at clock-in/out.
 */
export async function verifyAndClaimClockToken(
  rawToken: string,
  mechanicId: string,
): Promise<VerifiedClockToken> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("verify_clock_token", {
    p_raw_token: rawToken,
    p_mechanic_id: mechanicId,
  });

  if (error) throw error;

  return data as VerifiedClockToken;
}

// ── Register Device ────────────────────────────────────────────────────────

/**
 * Register the caller's phone as a trusted device for QR clock-in.
 * Requires a valid registration token (from admin-generated QR).
 * The device_fingerprint should be a stable unique ID generated on the phone.
 */
export async function registerDevice(
  orgId: string,
  registrationToken: string,
  deviceFingerprint: string,
  deviceName?: string,
): Promise<DeviceRegistration> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("register_mechanic_device", {
    p_org_id: orgId,
    p_registration_token: registrationToken,
    p_device_fingerprint: deviceFingerprint,
    p_device_name: deviceName ?? null,
  });

  if (error) throw error;

  const result = data as {
    success: boolean;
    device_id: string;
    reason?: string;
  };
  if (!result.success) {
    throw new Error(result.reason ?? "Device registration failed");
  }
  revalidateTag(cacheTags.mechanicDevices(orgId), "default");
  return { success: result.success, deviceId: result.device_id };
}

// ── Get Registered Devices ────────────────────────────────────────────────

/**
 * List registered devices for an organization.
 * If mechanicId is provided, filters to that mechanic.
 * This calls the list_mechanic_devices RPC so RLS is respected.
 */
export async function getRegisteredDevices(
  orgId: string,
  mechanicId?: string,
): Promise<DeviceInfo[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("list_mechanic_devices", {
    p_org_id: orgId,
    p_mechanic_id: mechanicId ?? null,
  });

  if (error) throw error;

  return (data ?? []).map((d: Record<string, unknown>) => ({
    deviceId: d.device_id as string,
    mechanicId: d.mechanic_id as string,
    mechanicName: d.mechanic_name as string | null,
    deviceName: d.device_name as string | null,
    deviceFingerprint: d.device_fingerprint as string,
    lastUsedAt: d.last_used_at as string | null,
    createdAt: d.created_at as string,
    revokedAt: d.revoked_at as string | null,
    isActive: d.is_active as boolean,
  }));
}

// ── Revoke Device (Admin) ─────────────────────────────────────────────────

/**
 * Admin-only: revoke a registered device (lost/stolen phone).
 */
export async function revokeDevice(deviceId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("revoke_mechanic_device", {
    p_device_id: deviceId,
  });

  if (error) throw error;
}

// ── Generate Admin Registration Token ─────────────────────────────────────

/**
 * Admin generates a registration token QR for a specific mechanic.
 * The QR will encode: { t: rawToken, s: sessionId, a: "register_device" }
 * Expires in 5 minutes.
 */
export async function generateRegistrationToken(
  orgId: string,
  mechanicId: string,
): Promise<ClockToken> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("generate_registration_token", {
    p_org_id: orgId,
    p_mechanic_id: mechanicId,
  });

  if (error) throw error;
  if (!data) throw new Error("Failed to generate registration token");

  const result = data as {
    raw_token: string;
    session_id: string;
    expires_at: string;
  };
  return {
    rawToken: result.raw_token,
    sessionId: result.session_id,
    expiresAt: result.expires_at,
  };
}
