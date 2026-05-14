import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createAuditLog } from "@/lib/audit";
import { withCache } from "@/lib/cache/with-cache";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import { createCustomer } from "./customer-service";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/cache/with-cache", () => ({ withCache: vi.fn((_key, fn) => fn()) }));
vi.mock("@/lib/audit", () => ({ createAuditLog: vi.fn().mockResolvedValue({ success: true, id: "audit-1" }) }));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

describe("createCustomer", () => {
  const mockClient = createMockSupabaseClient();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(mockClient as unknown as Awaited<ReturnType<typeof createClient>>);
  });

  it("creates a customer with valid data", async () => {
    mockClient.from("customers").maybeSingle
      .mockResolvedValueOnce({ data: null, error: null });
    mockClient.from("customers").select.mockReturnThis();
    mockClient.from("customers").single.mockResolvedValueOnce({
      data: { id: "cust-1", first_name: "Bat", phone: "99112233" },
      error: null,
    });

    const result = await createCustomer("org-1", { firstName: "Bat", phone: "99112233" }, "user-1");

    expect(result.first_name).toBe("Bat");
    expect(createAuditLog).toHaveBeenCalled();
  });

  it("rejects duplicate phone numbers", async () => {
    mockClient.from("customers").maybeSingle.mockResolvedValueOnce({
      data: { id: "existing-id" },
      error: null,
    });

    await expect(
      createCustomer("org-1", { firstName: "Dul", phone: "99112233" }, "user-1")
    ).rejects.toThrow("already exists");
  });

  it("validates that at least one identifying field is required", async () => {
    await expect(
      createCustomer("org-1", { firstName: "" }, "user-1")
    ).rejects.toThrow("At least one identifying field");
  });
});
