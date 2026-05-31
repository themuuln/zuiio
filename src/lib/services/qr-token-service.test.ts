import { revalidateTag } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import {
  generateClockToken,
  generateRegistrationToken,
  getRegisteredDevices,
  registerDevice,
  revokeDevice,
  verifyAndClaimClockToken,
} from "./qr-token-service";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

const mockClient = createMockSupabaseClient();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createClient).mockResolvedValue(
    mockClient as unknown as Awaited<ReturnType<typeof createClient>>,
  );
});

describe("generateClockToken", () => {
  it("calls RPC and returns parsed token", async () => {
    const mockResponse = {
      raw_token: "tok_abc123",
      session_id: "sess_xyz789",
      expires_at: "2026-05-31T01:01:00.000Z",
    };

    mockClient.rpc = vi.fn().mockResolvedValue({
      data: mockResponse,
      error: null,
    });

    const result = await generateClockToken("org-1", "clock_in");

    expect(mockClient.rpc).toHaveBeenCalledWith("generate_clock_token", {
      p_org_id: "org-1",
      p_action_type: "clock_in",
    });

    expect(result).toEqual({
      rawToken: "tok_abc123",
      sessionId: "sess_xyz789",
      expiresAt: "2026-05-31T01:01:00.000Z",
    });
  });

  it("throws error when RPC returns no data", async () => {
    mockClient.rpc = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(generateClockToken("org-1", "clock_in")).rejects.toThrow(
      "Failed to generate clock token",
    );
  });

  it("throws when RPC returns an error", async () => {
    const rpcError = new Error("Permission denied");
    mockClient.rpc = vi.fn().mockResolvedValue({
      data: null,
      error: rpcError,
    });

    await expect(generateClockToken("org-1", "clock_in")).rejects.toThrow(
      "Permission denied",
    );
  });
});

describe("verifyAndClaimClockToken", () => {
  it("returns valid true for correct token", async () => {
    const mockResponse = {
      valid: true,
      sessionId: "sess_xyz789",
      actionType: "clock_in",
    };

    mockClient.rpc = vi.fn().mockResolvedValue({
      data: mockResponse,
      error: null,
    });

    const result = await verifyAndClaimClockToken("tok_abc123", "mech-1");

    expect(mockClient.rpc).toHaveBeenCalledWith("verify_clock_token", {
      p_raw_token: "tok_abc123",
      p_mechanic_id: "mech-1",
    });

    expect(result).toEqual({
      valid: true,
      sessionId: "sess_xyz789",
      actionType: "clock_in",
    });
  });

  it("rejects invalid token with reason", async () => {
    const mockResponse = {
      valid: false,
      reason: "Token expired",
    };

    mockClient.rpc = vi.fn().mockResolvedValue({
      data: mockResponse,
      error: null,
    });

    const result = await verifyAndClaimClockToken("tok_expired", "mech-1");

    expect(result).toEqual({
      valid: false,
      reason: "Token expired",
    });
    expect(result.valid).toBe(false);
  });

  it("throws when RPC returns an error", async () => {
    const rpcError = new Error("Database error");
    mockClient.rpc = vi.fn().mockResolvedValue({
      data: null,
      error: rpcError,
    });

    await expect(
      verifyAndClaimClockToken("tok_abc123", "mech-1"),
    ).rejects.toThrow("Database error");
  });
});

describe("registerDevice", () => {
  it("calls RPC and returns device registration", async () => {
    const mockResponse = {
      success: true,
      device_id: "dev_001",
    };

    mockClient.rpc = vi.fn().mockResolvedValue({
      data: mockResponse,
      error: null,
    });

    const result = await registerDevice(
      "org-1",
      "reg_token_xyz",
      "fp_abc123",
      "My Phone",
    );

    expect(mockClient.rpc).toHaveBeenCalledWith("register_mechanic_device", {
      p_org_id: "org-1",
      p_registration_token: "reg_token_xyz",
      p_device_fingerprint: "fp_abc123",
      p_device_name: "My Phone",
    });

    expect(result).toEqual({
      success: true,
      deviceId: "dev_001",
    });

    expect(revalidateTag).toHaveBeenCalled();
  });

  it("passes null device name when not provided", async () => {
    const mockResponse = {
      success: true,
      device_id: "dev_002",
    };

    mockClient.rpc = vi.fn().mockResolvedValue({
      data: mockResponse,
      error: null,
    });

    await registerDevice("org-1", "reg_token_xyz", "fp_def456");

    expect(mockClient.rpc).toHaveBeenCalledWith("register_mechanic_device", {
      p_org_id: "org-1",
      p_registration_token: "reg_token_xyz",
      p_device_fingerprint: "fp_def456",
      p_device_name: null,
    });
  });

  it("throws when RPC returns an error", async () => {
    const rpcError = new Error("Device already registered");
    mockClient.rpc = vi.fn().mockResolvedValue({
      data: null,
      error: rpcError,
    });

    await expect(
      registerDevice("org-1", "reg_token_xyz", "fp_abc123"),
    ).rejects.toThrow("Device already registered");
  });
});

describe("getRegisteredDevices", () => {
  it("returns device list from RPC", async () => {
    const now = new Date().toISOString();
    const mockRows = [
      {
        device_id: "dev_001",
        mechanic_id: "mech-1",
        mechanic_name: "John Doe",
        device_name: "My Phone",
        device_fingerprint: "fp_abc",
        last_used_at: now,
        created_at: now,
        revoked_at: null,
        is_active: true,
      },
      {
        device_id: "dev_002",
        mechanic_id: "mech-2",
        mechanic_name: null,
        device_name: null,
        device_fingerprint: "fp_def",
        last_used_at: null,
        created_at: now,
        revoked_at: now,
        is_active: false,
      },
    ];

    mockClient.rpc = vi.fn().mockResolvedValue({
      data: mockRows,
      error: null,
    });

    const result = await getRegisteredDevices("org-1", "mech-1");

    expect(mockClient.rpc).toHaveBeenCalledWith("list_mechanic_devices", {
      p_org_id: "org-1",
      p_mechanic_id: "mech-1",
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      deviceId: "dev_001",
      mechanicId: "mech-1",
      mechanicName: "John Doe",
      deviceName: "My Phone",
      deviceFingerprint: "fp_abc",
      lastUsedAt: now,
      createdAt: now,
      revokedAt: null,
      isActive: true,
    });
    expect(result[1]).toEqual({
      deviceId: "dev_002",
      mechanicId: "mech-2",
      mechanicName: null,
      deviceName: null,
      deviceFingerprint: "fp_def",
      lastUsedAt: null,
      createdAt: now,
      revokedAt: now,
      isActive: false,
    });
  });

  it("returns empty array when RPC returns null", async () => {
    mockClient.rpc = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });

    const result = await getRegisteredDevices("org-1");
    expect(result).toEqual([]);
  });

  it("passes null mechanicId when not provided", async () => {
    mockClient.rpc = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });

    await getRegisteredDevices("org-1");

    expect(mockClient.rpc).toHaveBeenCalledWith("list_mechanic_devices", {
      p_org_id: "org-1",
      p_mechanic_id: null,
    });
  });

  it("throws when RPC returns an error", async () => {
    const rpcError = new Error("Forbidden");
    mockClient.rpc = vi.fn().mockResolvedValue({
      data: null,
      error: rpcError,
    });

    await expect(getRegisteredDevices("org-1")).rejects.toThrow("Forbidden");
  });
});

describe("revokeDevice", () => {
  it("calls RPC and returns void on success", async () => {
    mockClient.rpc = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });

    await revokeDevice("dev_001");

    expect(mockClient.rpc).toHaveBeenCalledWith("revoke_mechanic_device", {
      p_device_id: "dev_001",
    });
  });

  it("throws when RPC returns an error", async () => {
    const rpcError = new Error("Device not found");
    mockClient.rpc = vi.fn().mockResolvedValue({
      data: null,
      error: rpcError,
    });

    await expect(revokeDevice("dev_not_found")).rejects.toThrow(
      "Device not found",
    );
  });
});

describe("generateRegistrationToken", () => {
  it("calls RPC and returns parsed token", async () => {
    const mockResponse = {
      raw_token: "reg_tok_001",
      session_id: "reg_sess_001",
      expires_at: "2026-05-31T01:05:00.000Z",
    };

    mockClient.rpc = vi.fn().mockResolvedValue({
      data: mockResponse,
      error: null,
    });

    const result = await generateRegistrationToken("org-1", "mech-1");

    expect(mockClient.rpc).toHaveBeenCalledWith("generate_registration_token", {
      p_org_id: "org-1",
      p_mechanic_id: "mech-1",
    });

    expect(result).toEqual({
      rawToken: "reg_tok_001",
      sessionId: "reg_sess_001",
      expiresAt: "2026-05-31T01:05:00.000Z",
    });
  });

  it("throws error when RPC returns no data", async () => {
    mockClient.rpc = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(generateRegistrationToken("org-1", "mech-1")).rejects.toThrow(
      "Failed to generate registration token",
    );
  });

  it("throws when RPC returns an error", async () => {
    const rpcError = new Error("Mechanic not found");
    mockClient.rpc = vi.fn().mockResolvedValue({
      data: null,
      error: rpcError,
    });

    await expect(generateRegistrationToken("org-1", "mech-1")).rejects.toThrow(
      "Mechanic not found",
    );
  });
});
