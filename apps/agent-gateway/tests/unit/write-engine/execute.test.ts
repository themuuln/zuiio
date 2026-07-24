import { describe, expect, it, vi } from "vitest";

const mockCatalog = {
	tenant: { column: "organization_id" },
	datasets: {
		customers: {
			source: "customers",
			displayName: "Харилцагчид",
			pk: "id",
			insertable: true,
			updatable: true,
			deletable: true,
			fields: {
				name: { type: "string", required: true },
				phone: { type: "string" },
				organization_id: { type: "string", writable: false },
			},
		},
	},
};

describe("executeMutation", () => {
	it("executes an insert operation and returns the new row", async () => {
		const mockSupabase = {
			from: vi.fn().mockReturnThis(),
			insert: vi.fn().mockReturnThis(),
			select: vi.fn().mockReturnThis(),
			single: vi.fn().mockResolvedValue({
				data: { id: "new-123", name: "Test Customer" },
				error: null,
			}),
		};

		const { executeMutation } = await import("@/write-engine/execute");

		const result = await executeMutation(
			{
				source: "customers",
				operation: "insert",
				payload: { name: "Test Customer", phone: "99112233" },
				softDelete: false,
				tenantId: "org-1",
				description: "Insert test customer",
			},
			mockCatalog as never,
			mockSupabase as never,
		);

		expect(result.success).toBe(true);
		expect(result.message).toContain("бүртгэгдлээ");
		expect(result.id).toBe("new-123");
		expect(mockSupabase.from).toHaveBeenCalledWith("customers");
		expect(mockSupabase.insert).toHaveBeenCalledWith({
			name: "Test Customer",
			phone: "99112233",
		});
	});

	it("returns error message on insert failure", async () => {
		const mockSupabase = {
			from: vi.fn().mockReturnThis(),
			insert: vi.fn().mockReturnThis(),
			select: vi.fn().mockReturnThis(),
			single: vi.fn().mockResolvedValue({
				data: null,
				error: { message: "duplicate key value", code: "23505" },
			}),
		};

		const { executeMutation } = await import("@/write-engine/execute");

		const result = await executeMutation(
			{
				source: "customers",
				operation: "insert",
				payload: { name: "Test" },
				softDelete: false,
				tenantId: "org-1",
				description: "Insert",
			},
			mockCatalog as never,
			mockSupabase as never,
		);

		expect(result.success).toBe(false);
		expect(result.message).toContain("Ижил бүртгэл");
	});

	it("executes an update operation with tenant isolation", async () => {
		const mockSupabase = {
			from: vi.fn().mockReturnThis(),
			update: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			select: vi.fn().mockReturnThis(),
			single: vi.fn().mockResolvedValue({
				data: { id: "cust-1", name: "Updated" },
				error: null,
			}),
		};

		const { executeMutation } = await import("@/write-engine/execute");

		const result = await executeMutation(
			{
				source: "customers",
				operation: "update",
				id: "cust-1",
				payload: { name: "Updated Name" },
				softDelete: false,
				tenantId: "org-1",
				description: "Update customer",
			},
			mockCatalog as never,
			mockSupabase as never,
		);

		expect(result.success).toBe(true);
		expect(result.message).toContain("шинэчлэгдлээ");
		// Verify tenant isolation
		const eqCalls = mockSupabase.eq.mock.calls;
		expect(eqCalls).toContainEqual(["id", "cust-1"]);
		expect(eqCalls).toContainEqual(["organization_id", "org-1"]);
	});

	it("executes a soft delete as update with deleted_at", async () => {
		const mockSupabase = {
			from: vi.fn().mockReturnThis(),
			update: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			select: vi.fn().mockReturnThis(),
			single: vi.fn().mockResolvedValue({
				data: { id: "cust-1", deleted_at: "2026-01-01T00:00:00Z" },
				error: null,
			}),
		};

		const { executeMutation } = await import("@/write-engine/execute");

		const result = await executeMutation(
			{
				source: "customers",
				operation: "update",
				id: "cust-1",
				payload: { deleted_at: "2026-01-01T00:00:00Z" },
				softDelete: true,
				tenantId: "org-1",
				description: "Soft delete customer",
			},
			mockCatalog as never,
			mockSupabase as never,
		);

		expect(result.success).toBe(true);
		expect(result.message).toContain("soft");
	});

	it("executes a hard delete operation", async () => {
		const mockSupabase = {
			from: vi.fn().mockReturnThis(),
			delete: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
		};

		const { executeMutation } = await import("@/write-engine/execute");

		const result = await executeMutation(
			{
				source: "customers",
				operation: "delete",
				id: "cust-1",
				payload: {},
				softDelete: false,
				tenantId: "org-1",
				description: "Hard delete customer",
			},
			mockCatalog as never,
			mockSupabase as never,
		);

		expect(result.success).toBe(true);
		expect(result.message).toContain("устга");
	});

	it("returns error on delete failure", async () => {
		const mockSupabase = {
			from: vi.fn().mockReturnThis(),
			delete: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
		};

		// Make delete return an error
		mockSupabase.from.mockReturnThis();
		mockSupabase.delete.mockReturnThis();
		mockSupabase.eq.mockReturnValue(
			Promise.resolve({
				error: { message: "foreign key violation", code: "23503" },
			}),
		);

		const { executeMutation } = await import("@/write-engine/execute");

		const result = await executeMutation(
			{
				source: "customers",
				operation: "delete",
				id: "cust-1",
				payload: {},
				softDelete: false,
				tenantId: "org-1",
				description: "Delete",
			},
			mockCatalog as never,
			mockSupabase as never,
		);

		expect(result.success).toBe(false);
	});

	it("catches unexpected errors and returns error message", async () => {
		const mockSupabase = {
			from: vi.fn().mockImplementation(() => {
				throw new Error("Unexpected connection error");
			}),
		};

		const { executeMutation } = await import("@/write-engine/execute");

		const result = await executeMutation(
			{
				source: "customers",
				operation: "insert",
				payload: {},
				softDelete: false,
				tenantId: "org-1",
				description: "Insert",
			},
			mockCatalog as never,
			mockSupabase as never,
		);

		expect(result.success).toBe(false);
		expect(result.message).toContain("Бичих үед алдаа");
	});
});
