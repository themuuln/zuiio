import { describe, expect, it, vi } from "vitest";

// Mock engine internals
vi.mock("@/write-engine/validate", () => ({
	validateWritePlan: vi.fn(),
}));

vi.mock("@/write-engine/compile", () => ({
	compileMutation: vi.fn(),
}));

vi.mock("@/write-engine/execute", () => ({
	executeMutation: vi.fn(),
}));

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
			},
		},
	},
};

const mockConfig = {
	tenantId: "org-1",
	catalog: mockCatalog,
	supabase: {} as never,
};

describe("runWrite", () => {
	it("executes a valid write plan successfully", async () => {
		const { validateWritePlan } = await import("@/write-engine/validate");
		const { compileMutation } = await import("@/write-engine/compile");
		const { executeMutation } = await import("@/write-engine/execute");

		vi.mocked(validateWritePlan).mockReturnValue({
			valid: true,
			errors: [],
			warnings: [],
		});
		vi.mocked(compileMutation).mockReturnValue({
			source: "customers",
			operation: "insert",
			payload: { name: "Test", organization_id: "org-1" },
			softDelete: false,
			tenantId: "org-1",
			description: "Insert customer",
		});
		vi.mocked(executeMutation).mockResolvedValue({
			success: true,
			message: "Амжилттай бүртгэгдлээ.",
			id: "new-1",
		});

		const { runWrite } = await import("@/write-engine");

		const result = await runWrite(mockConfig as never, {
			dataset: "customers",
			operation: "insert",
			data: { name: "Test" },
		});

		expect(result.success).toBe(true);
		expect(result.message).toContain("бүртгэгдлээ");
	});

	it("returns validation error when plan is invalid", async () => {
		const { validateWritePlan } = await import("@/write-engine/validate");

		vi.mocked(validateWritePlan).mockReturnValue({
			valid: false,
			errors: [
				{
					code: "MISSING_DATA",
					message: "Өгөгдөл хоосон байна",
					field: "data",
				},
			],
			warnings: [],
		});

		const { runWrite } = await import("@/write-engine");

		const result = await runWrite(mockConfig as never, {
			dataset: "customers",
			operation: "insert",
		});

		expect(result.success).toBe(false);
		expect(result.message).toContain("алдаатай");
	});

	it("includes validation warnings in the result", async () => {
		const { validateWritePlan } = await import("@/write-engine/validate");
		const { compileMutation } = await import("@/write-engine/compile");
		const { executeMutation } = await import("@/write-engine/execute");

		vi.mocked(validateWritePlan).mockReturnValue({
			valid: true,
			errors: [],
			warnings: ["organization_id stripped from payload"],
		});
		vi.mocked(compileMutation).mockReturnValue({
			source: "customers",
			operation: "insert",
			payload: { name: "Test", organization_id: "org-1" },
			softDelete: false,
			tenantId: "org-1",
			description: "Insert",
		});
		vi.mocked(executeMutation).mockResolvedValue({
			success: true,
			message: "Амжилттай бүртгэгдлээ.",
			id: "new-1",
		});

		const { runWrite } = await import("@/write-engine");

		const result = await runWrite(mockConfig as never, {
			dataset: "customers",
			operation: "insert",
			data: { name: "Test", organization_id: "org-1" },
		});

		expect(result.warnings).toHaveLength(1);
		expect(result.warnings?.[0]).toBe("organization_id stripped from payload");
	});

	it("handles validation error without field property", async () => {
		const { validateWritePlan } = await import("@/write-engine/validate");

		vi.mocked(validateWritePlan).mockReturnValue({
			valid: false,
			errors: [
				{
					code: "INVALID_ENUM_VALUE",
					message: "Invalid status value",
				},
			],
			warnings: [],
		});

		const { runWrite } = await import("@/write-engine");

		const result = await runWrite(mockConfig as never, {
			dataset: "customers",
			operation: "insert",
			data: { name: "Test" },
		});

		expect(result.success).toBe(false);
	});
});
