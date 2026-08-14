import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const importCustomersMock = vi.fn();

vi.mock("@/lib/api-handler", () => ({
  createRouteHandler: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/api-response", () => ({
  apiError: vi.fn(
    (type: string, message: string, status: number) =>
      new Response(JSON.stringify({ error: { code: type, message } }), {
        status,
      }),
  ),
  ok: vi.fn(
    (data: unknown) => new Response(JSON.stringify({ data }), { status: 200 }),
  ),
}));

vi.mock("@/lib/services/customer-import-service", () => ({
  importCustomers: importCustomersMock,
}));

const { POST } = await import("./route");

describe("organizations/[id]/customers/import route", () => {
  const orgId = "org-1";
  const user = { id: "user-1" };
  const baseUrl = `http://localhost/api/organizations/${orgId}/customers/import`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST", () => {
    function createFormRequest(
      fileContent: string | null,
      fileName: string,
    ): NextRequest {
      const formData = new FormData();
      if (fileContent !== null) {
        const blob = new Blob([fileContent], { type: "text/csv" });
        const file = new File([blob], fileName, { type: "text/csv" });
        formData.append("file", file);
      }
      return new NextRequest(new URL(baseUrl), {
        method: "POST",
        body: formData,
      });
    }

    it("imports customers from CSV file", async () => {
      const csvContent = "name,phone\nJohn,1234";
      const result = { imported: 1, errors: [] };
      importCustomersMock.mockResolvedValue(result);

      const req = createFormRequest(csvContent, "customers.csv");
      const response = await (POST as any)({
        request: req,
        orgId,
        user,
        supabase: {},
      });
      const body = await response.json();

      expect(importCustomersMock).toHaveBeenCalledWith(
        {},
        orgId,
        csvContent,
        user.id,
      );
      expect(body.data).toEqual(result);
    });

    it("returns 400 when no file provided", async () => {
      const req = new NextRequest(new URL(baseUrl), {
        method: "POST",
        body: new FormData(),
      });
      const response = await (POST as any)({
        request: req,
        orgId,
        user,
        supabase: {},
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("INVALID_REQUEST");
    });

    it("returns 400 when file is not CSV", async () => {
      const req = createFormRequest("name,phone\nJohn,1234", "data.txt");
      const response = await (POST as any)({
        request: req,
        orgId,
        user,
        supabase: {},
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("INVALID_FILE_TYPE");
    });

    it("returns 400 when CSV file is empty", async () => {
      const req = createFormRequest("", "customers.csv");
      const response = await (POST as any)({
        request: req,
        orgId,
        user,
        supabase: {},
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("EMPTY_FILE");
    });

    it("handles service error", async () => {
      importCustomersMock.mockRejectedValue(new Error("Import failed"));

      const req = createFormRequest("name,phone\nJohn,1234", "customers.csv");
      await expect(
        (POST as any)({ request: req, orgId, user, supabase: {} }),
      ).rejects.toThrow("Import failed");
    });
  });
});
